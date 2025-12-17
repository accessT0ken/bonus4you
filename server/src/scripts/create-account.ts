import * as readline from 'readline';
import pool from '../config/database';
import bcrypt from 'bcryptjs';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function updateRoleEnum() {
  try {
    // Check if the enum needs to be updated
    const [rows] = await pool.execute(
      `SELECT COLUMN_TYPE 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'users' 
       AND COLUMN_NAME = 'role'`
    );
    
    const columnInfo = (rows as any[])[0];
    const currentEnum = columnInfo?.COLUMN_TYPE || '';
    
    // If enum doesn't include the new roles, update it
    if (!currentEnum.includes('moderator') || !currentEnum.includes('owner')) {
      console.log('🔄 Updating role enum to include moderator, admin, owner...');
      
      // MySQL doesn't support direct ENUM modification, so we need to alter the column
      await pool.execute(`
        ALTER TABLE users 
        MODIFY COLUMN role ENUM('moderator', 'admin', 'owner') DEFAULT 'moderator'
      `);
      
      console.log('✅ Role enum updated successfully');
    }
  } catch (error: any) {
    // If error is about enum values, try to handle it
    if (error.message.includes('ENUM')) {
      console.log('⚠️  Note: You may need to manually update the role enum in the database.');
      console.log('   Run: ALTER TABLE users MODIFY COLUMN role ENUM(\'moderator\', \'admin\', \'owner\') DEFAULT \'moderator\';');
    } else {
      throw error;
    }
  }
}

async function createUser() {
  try {
    console.log('\n📝 Create New User Account\n');
    console.log('Available roles: moderator, admin, owner\n');

    // Update role enum first
    await updateRoleEnum();

    // Get user input
    const email = await question('Email: ');
    if (!email || !email.includes('@')) {
      console.error('❌ Invalid email address');
      rl.close();
      process.exit(1);
    }

    const name = await question('Name: ');
    if (!name || name.trim().length === 0) {
      console.error('❌ Name is required');
      rl.close();
      process.exit(1);
    }

    const password = await question('Password: ');
    if (!password || password.length < 6) {
      console.error('❌ Password must be at least 6 characters');
      rl.close();
      process.exit(1);
    }

    const roleInput = await question('Role (moderator/admin/owner): ');
    const role = roleInput.toLowerCase().trim();
    
    if (!['moderator', 'admin', 'owner'].includes(role)) {
      console.error('❌ Invalid role. Must be one of: moderator, admin, owner');
      rl.close();
      process.exit(1);
    }

    // Check if email already exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if ((existing as any[]).length > 0) {
      console.error('❌ User with this email already exists');
      rl.close();
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Define permissions based on role
    const rolePermissions: Record<string, string[]> = {
      moderator: ['manage_casinos', 'edit_reviews', 'view_stats', 'publish_content'],
      admin: ['manage_users', 'manage_casinos', 'edit_reviews', 'view_stats', 'publish_content'],
      owner: ['manage_users', 'manage_casinos', 'edit_reviews', 'view_stats', 'publish_content', 'manage_system'],
    };

    const permissions = rolePermissions[role] || [];

    // Insert user
    const [result] = await pool.execute(
      `INSERT INTO users (email, name, password_hash, role, permissions, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [email, name.trim(), passwordHash, role, JSON.stringify(permissions)]
    );

    const insertResult = result as any;
    const [newUser] = await pool.execute(
      'SELECT id, email, name, role, permissions, is_active, created_at FROM users WHERE id = ?',
      [insertResult.insertId]
    );

    const user = (newUser as any[])[0];

    console.log('\n✅ User created successfully!\n');
    console.log('User Details:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Permissions: ${user.permissions}`);
    console.log(`  Active: ${user.is_active === 1 ? 'Yes' : 'No'}`);
    console.log(`  Created: ${user.created_at}\n`);

  } catch (error: any) {
    console.error('❌ Error creating user:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      console.error('   A user with this email already exists');
    }
    process.exit(1);
  } finally {
    rl.close();
    await pool.end();
  }
}

// Run the script
createUser().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

