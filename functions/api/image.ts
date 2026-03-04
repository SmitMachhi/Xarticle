import { handleImage } from '../../worker/src/routes/image'

export const onRequestGet: PagesFunction = async ({ request }) => handleImage(request)
