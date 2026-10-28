import pandaFaceIcon from '../../../assets/panda-face-nobg.png'
import { APP_NAME, CREDIT_NAME, CREDIT_URL } from '../constants/uiContent'

export const TopBar = () => {
  return (
    <header className="flex items-center justify-between text-sm print:hidden">
      <span className="flex items-center gap-2 font-semibold tracking-tight">
        <img alt="" aria-hidden="true" className="size-7 [image-rendering:pixelated]" src={pandaFaceIcon} />
        {APP_NAME}
      </span>
      <a className="text-neutral-500 transition-colors hover:text-neutral-900" href={CREDIT_URL} rel="noreferrer" target="_blank">{CREDIT_NAME}</a>
    </header>
  )
}
