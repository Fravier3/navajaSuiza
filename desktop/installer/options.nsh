!ifndef BUILD_UNINSTALLER
!include "nsDialogs.nsh"
!include "LogicLib.nsh"
!include "FileFunc.nsh"
Var ArsenalTools
Var ArsenalExplorer
Var ArsenalToolCheckbox
Var ArsenalExplorerCheckbox
Var ArsenalExpandButton

!macro customInit
  StrCpy $ArsenalTools 0
  StrCpy $ArsenalExplorer 0
  ${GetParameters} $R0
  ClearErrors
  ${GetOptions} $R0 "/ENABLEPROTOOLS" $R1
  ${IfNot} ${Errors}
    StrCpy $ArsenalTools 1
  ${EndIf}
  ClearErrors
  ${GetOptions} $R0 "/ENABLEEXPLORER" $R1
  ${IfNot} ${Errors}
    StrCpy $ArsenalExplorer 1
  ${EndIf}
!macroend

!ifndef BUILD_UNINSTALLER
!macro customHeader
Function ArsenalExpand
  ShowWindow $ArsenalToolCheckbox ${SW_SHOW}
  ShowWindow $ArsenalExplorerCheckbox ${SW_SHOW}
  EnableWindow $ArsenalExpandButton 0
FunctionEnd

Function ArsenalOptions
  !insertmacro MUI_HEADER_TEXT "Personaliza Arsenal" "Desarrollado por Francisco J Vazquez Santiago"
  nsDialogs::Create 1018
  Pop $R0
  ${NSD_CreateLabel} 0 0 100% 35u "Arsenal incluye 16 herramientas visibles por defecto. Las herramientas opcionales solo aparecerán si las seleccionas aquí."
  Pop $R0
  ${NSD_CreateButton} 0 43u 75% 18u "Mostrar herramientas opcionales (avanzado)"
  Pop $ArsenalExpandButton
  ${NSD_OnClick} $ArsenalExpandButton ArsenalExpand
  ${NSD_CreateCheckbox} 10u 78u 90% 15u "Mostrar Pro Tools-FJ"
  Pop $ArsenalToolCheckbox
  ${NSD_SetState} $ArsenalToolCheckbox $ArsenalTools
  ${NSD_CreateCheckbox} 10u 104u 90% 15u "Mostrar Explorador de archivos-FJ"
  Pop $ArsenalExplorerCheckbox
  ${NSD_SetState} $ArsenalExplorerCheckbox $ArsenalExplorer
  ShowWindow $ArsenalToolCheckbox ${SW_HIDE}
  ShowWindow $ArsenalExplorerCheckbox ${SW_HIDE}
  nsDialogs::Show
FunctionEnd

Function ArsenalOptionsLeave
  ${NSD_GetState} $ArsenalToolCheckbox $ArsenalTools
  ${NSD_GetState} $ArsenalExplorerCheckbox $ArsenalExplorer
FunctionEnd
!macroend
!endif

!macro customPageAfterChangeDir
  Page custom ArsenalOptions ArsenalOptionsLeave
!macroend

!macro customInstall
  StrCpy $R1 "false"
  StrCpy $R2 "false"
  ${If} $ArsenalTools == 1
    StrCpy $R1 "true"
  ${EndIf}
  ${If} $ArsenalExplorer == 1
    StrCpy $R2 "true"
  ${EndIf}
  FileOpen $R0 "$INSTDIR\resources\install-options.json" w
  FileWrite $R0 '{$\"proTools$\":$R1,$\"explorer$\":$R2}'
  FileClose $R0
!macroend

!endif
