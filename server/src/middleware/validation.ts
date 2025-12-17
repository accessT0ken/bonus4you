import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain, ValidationError } from 'express-validator';
import { ValidationError as CustomValidationError } from '../types/errors';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Run all validations
      await Promise.all(validations.map((validation) => validation.run(req)));

      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        // Format errors to match the desired structure
        const formattedErrors: Record<string, string> = {};
        
        errors.array().forEach((error: ValidationError) => {
          // Get field name from error - express-validator uses 'path' for body/query and 'param' for params
          const field = (error as any).path || (error as any).param || (error as any).location || 'unknown';
          const msg = error.msg;
          
          // For param errors, use the param name directly
          const errorField = (error as any).type === 'field' 
            ? ((error as any).path || (error as any).param)
            : field;
          
          // If field already has an error, combine them
          if (formattedErrors[errorField]) {
            formattedErrors[errorField] = `${formattedErrors[errorField]}, ${msg}`;
          } else {
            formattedErrors[errorField] = msg;
          }
        });

        // Pass error to next error handler instead of throwing
        return next(new CustomValidationError(formattedErrors));
      }

      next();
    } catch (error) {
      // Catch any unexpected errors and pass to error handler
      next(error);
    }
  };
};
