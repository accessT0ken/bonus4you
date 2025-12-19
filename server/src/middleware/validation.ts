import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain, ValidationError } from 'express-validator';
import { ValidationError as CustomValidationError } from '../types/errors';

/**
 * Validation middleware wrapper
 * @param {ValidationChain[]} validations - Array of validation chains
 * @returns {Function} Express middleware function
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await Promise.all(validations.map((validation) => validation.run(req)));

      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        const formattedErrors: Record<string, string> = {};
        
        errors.array().forEach((error: ValidationError) => {
          const field = (error as any).path || (error as any).param || (error as any).location || 'unknown';
          const msg = error.msg;
          
          const errorField = (error as any).type === 'field' 
            ? ((error as any).path || (error as any).param)
            : field;
          
          if (formattedErrors[errorField]) {
            formattedErrors[errorField] = `${formattedErrors[errorField]}, ${msg}`;
          } else {
            formattedErrors[errorField] = msg;
          }
        });

        return next(new CustomValidationError(formattedErrors));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
