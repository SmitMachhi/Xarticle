import { CREDIT_NAME, CREDIT_URL } from '../constants/uiContent'

export const CreditFooter = () => {
  return (
    <footer className="flex justify-end px-4 pb-5 text-sm sm:px-6 print:hidden">
      <a className="text-neutral-500 transition-colors hover:text-neutral-900" href={CREDIT_URL} rel="noreferrer" target="_blank">{CREDIT_NAME}</a>
    </footer>
  )
}
