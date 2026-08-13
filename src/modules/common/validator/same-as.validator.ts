import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

/**
 * Example of a custom class-validator constraint: asserts that the decorated
 * property equals another property of the same DTO (password confirmation).
 */
export const SameAs = (property: string, validationOptions?: ValidationOptions) => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'sameAs',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as string[];
          return value === (args.object as Record<string, unknown>)[relatedPropertyName];
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as string[];
          return `${args.property} must match ${relatedPropertyName}`;
        },
      },
    });
  };
};
