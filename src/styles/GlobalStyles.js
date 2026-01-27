import { createGlobalStyle } from 'styled-components'

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    width: 100%;
    overflow-x: hidden;
    /* Ensure sticky positioning works */
    position: relative;
  }
  
  html {
    /* Ensure html is the scrolling container for sticky */
    height: 100%;
  }
  
  body {
    /* Ensure body is the scrolling container */
    min-height: 100%;
  }

  body {
    font-family: ${props => props.theme.typography.fontFamily};
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text.primary};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    line-height: 1.6;
  }

  #root {
    min-height: 100vh;
    width: 100%;
  }
`

