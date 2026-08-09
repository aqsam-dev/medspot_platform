import { createContext, useContext, useState } from "react"

var ThemeContext = createContext()

export function ThemeProvider(props) {
  var [darkMode, setDarkMode] = useState(false)
  function toggleDark() { setDarkMode(function(prev) { return !prev }) }
  return (
    <ThemeContext.Provider value={{ darkMode: darkMode, toggleDark: toggleDark }}>
      {props.children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}