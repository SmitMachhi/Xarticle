import pandaFaceIcon from '../../../assets/panda-face-nobg.png'
import {
  APP_NAME,
  FOOTER_CREDIT_LABEL,
  FOOTER_CREDIT_NAME,
  FOOTER_CREDIT_URL,
} from '../constants/uiContent'

export const FooterSection = () => {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="site-footer-brand">
          <img alt="" aria-hidden="true" className="site-footer-icon" src={pandaFaceIcon} />
          <span>{APP_NAME}</span>
        </p>
        <p className="site-footer-credit">
          {FOOTER_CREDIT_LABEL}{' '}
          <a href={FOOTER_CREDIT_URL} rel="noreferrer" target="_blank">
            {FOOTER_CREDIT_NAME}
          </a>
        </p>
      </div>
    </footer>
  )
}
