declare module "mrz" {
  export interface MrzFields {
    documentType?: string
    country?: string
    surname?: string
    firstName?: string
    documentNumber?: string
    nationality?: string
    birthDate?: string
    sex?: string
    expiryDate?: string
  }

  export interface MrzResult {
    format?: string
    fields: MrzFields
  }

  export function parse(mrz: string): MrzResult
}
