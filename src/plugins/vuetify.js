import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css';
import { createVuetify } from 'vuetify'

export default createVuetify({
  defaults: {
    VChip: {
      variant: 'flat',
      size: 'small',
    },
    VTextField: {
      variant: 'outlined',
      density: 'compact',
    },
    VTextarea: {
      variant: 'outlined',
      density: 'compact',
    },
    VCombobox: {
      variant: 'outlined',
      density: 'compact',
    },
  },
})
