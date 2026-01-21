import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // server: {
  //   host: '0.0.0.0',
  //   https:true
  // }

})


// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import basicSsl from '@vitejs/plugin-basic-ssl'

// export default defineConfig({
//   plugins: [
//     react(),
//     basicSsl()
//   ],
//   server: {
//     host: '0.0.0.0'
//   }
// })
