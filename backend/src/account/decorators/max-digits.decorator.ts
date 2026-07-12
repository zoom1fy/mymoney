import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function MaxDigits(maxDigits: number, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'maxDigits',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (value === null || value === undefined) return true;
          const strValue = String(value);
          return strValue.length <= maxDigits;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must not be more than ${maxDigits} digits`;
        },
      },
    });
  };
}
