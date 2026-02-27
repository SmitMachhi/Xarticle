import { routeRequest } from './routes/router'

export default {
  async fetch(request) {
    return await routeRequest(request)
  },
}
