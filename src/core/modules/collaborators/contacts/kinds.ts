import { TABLES, usePartners, useSuppliers } from '../store'
import type { Partner, Supplier } from '../types'

export type ContactKind = 'partners' | 'suppliers'
export type Contact = Partner | Supplier

export const CONTACT_PATH: Record<ContactKind, string> = {
  partners: '/colaboradores/parceiros',
  suppliers: '/colaboradores/fornecedores',
}

export const CONTACT_TABLE: Record<ContactKind, string> = {
  partners: TABLES.partners,
  suppliers: TABLES.suppliers,
}

export function useContacts(kind: ContactKind): Contact[] {
  const partners = usePartners()
  const suppliers = useSuppliers()
  return kind === 'partners' ? partners : suppliers
}

export const isSupplier = (contact: Contact): contact is Supplier => 'supplies' in contact
