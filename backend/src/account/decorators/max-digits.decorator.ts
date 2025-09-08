import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function MaxDigits(maxDigits: number, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'maxDigits',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (value === null || value === undefined) return true;
          const strValue = value.toString();
          return strValue.length <= maxDigits;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must not be more than ${maxDigits} digits`;
        },
      },
    });
  };
}
