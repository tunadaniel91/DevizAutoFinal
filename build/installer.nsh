; Custom NSIS installer script for better Windows compatibility
!macro customInit
  ; Check Windows version compatibility
  ${If} ${AtLeastWin7}
    ; Windows 7 and above - proceed normally
  ${Else}
    MessageBox MB_OK|MB_ICONSTOP "This application requires Windows 7 or later."
    Quit
  ${EndIf}
!macroend

!macro customInstall
  ; Create additional shortcuts if needed
  CreateShortCut "$DESKTOP\Deviz Auto.lnk" "$INSTDIR\Deviz Auto.exe"
  
  ; Register file associations if needed
  WriteRegStr HKCR ".deviz" "" "DevizAuto.Document"
  WriteRegStr HKCR "DevizAuto.Document" "" "Deviz Auto Document"
  WriteRegStr HKCR "DevizAuto.Document\DefaultIcon" "" "$INSTDIR\Deviz Auto.exe,0"
  WriteRegStr HKCR "DevizAuto.Document\shell\open\command" "" '"$INSTDIR\Deviz Auto.exe" "%1"'
!macroend

!macro customUnInstall
  ; Clean up registry entries
  DeleteRegKey HKCR ".deviz"
  DeleteRegKey HKCR "DevizAuto.Document"
  
  ; Remove desktop shortcut
  Delete "$DESKTOP\Deviz Auto.lnk"
!macroend
