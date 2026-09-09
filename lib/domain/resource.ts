export type FieldType = "text" | "textarea" | "date" | "time" | "select"

export type FieldDef = {
  name: string
  label: string
  type: FieldType
  options?: { label: string; value: string }[]
}

export type ResourceRecord = {
  id: string
  name: string
} & Record<string, string>

export type ResourceSchema = {
  slug: string
  title: string
  singular: string
  description: string
  fields: FieldDef[]
}
