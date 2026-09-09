"use client"

import { useState } from "react"
import { IconEye, IconEyeOff } from "@tabler/icons-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

type PasswordFieldProps = {
  id: string
  name: string
  placeholder?: string
  autoComplete?: string
  required?: boolean
  value?: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function PasswordField({
  id,
  name,
  placeholder = "Masukkan kata laluan",
  autoComplete = "current-password",
  required = true,
  value,
  onChange,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <InputGroup className="h-11 min-h-11 bg-background">
      <InputGroupInput
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={onChange}
        className="h-11 min-h-11"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label={visible ? "Sembunyikan kata laluan" : "Tunjukkan kata laluan"}
          aria-pressed={visible}
          onPress={() => setVisible((current) => !current)}
        >
          {visible ? <IconEyeOff /> : <IconEye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
