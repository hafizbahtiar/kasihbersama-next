"use client"

import { useState } from "react"
import { IconEye, IconEyeOff } from "@tabler/icons-react"

import { type ControlSize } from "@/components/ui/control-size"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

type PasswordFieldProps = {
  id: string
  name: string
  size?: ControlSize
  placeholder?: string
  autoComplete?: string
  required?: boolean
  value?: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function PasswordField({
  id,
  name,
  size = "xl",
  placeholder = "Masukkan kata laluan",
  autoComplete = "current-password",
  required = true,
  value,
  onChange,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <InputGroup size={size} className="bg-background">
      <InputGroupInput
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={onChange}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label={
            visible ? "Sembunyikan kata laluan" : "Tunjukkan kata laluan"
          }
          aria-pressed={visible}
          onPress={() => setVisible((current) => !current)}
        >
          {visible ? <IconEyeOff /> : <IconEye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
