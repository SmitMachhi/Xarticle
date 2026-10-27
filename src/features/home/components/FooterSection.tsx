import { FOOTER_CREDIT_LABEL, FOOTER_CREDIT_NAME, FOOTER_CREDIT_URL } from '../constants/uiContent'

export const FooterSection = () => {
  return (
    <footer className="site-footer">
      {FOOTER_CREDIT_LABEL} <a href={FOOTER_CREDIT_URL} rel="noreferrer" target="_blank">{FOOTER_CREDIT_NAME}</a>
    </footer>
  )
}
