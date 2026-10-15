import InputMask from 'react-input-mask'
import { TextField, type TextFieldProps } from '@mui/material'
import type { ComponentProps, ComponentType, InputHTMLAttributes, ReactNode } from 'react'

type MaskedTextFieldProps = Omit<TextFieldProps, 'value' | 'onChange'> & {
  mask: string
  value: string
  onChange: (value: string) => void
}

type MaskedInputProps = Omit<ComponentProps<typeof InputMask>, 'children'> & {
  children: (inputProps: InputHTMLAttributes<HTMLInputElement>) => ReactNode
}

const MaskedInput = InputMask as unknown as ComponentType<MaskedInputProps>

export default function MaskedTextField({ mask, value, onChange, ...rest }: MaskedTextFieldProps) {
  return (
    <MaskedInput
      mask={mask}
      maskChar={null}
      value={value}
      disabled={rest.disabled}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
    >
      {(inputProps) => <TextField {...rest} {...(inputProps as Record<string, unknown>)} />}
    </MaskedInput>
  )
}
