# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Iniciar Sesión" [level=2] [ref=e5]
      - paragraph [ref=e6]: Sistema de Repetición Espaciada
    - generic [ref=e7]:
      - paragraph [ref=e9]: Invalid login credentials
      - generic [ref=e10]:
        - generic [ref=e11]:
          - generic [ref=e12]: Email
          - textbox "Email" [ref=e13]: test@studyapp.com
        - generic [ref=e14]:
          - generic [ref=e15]: Contraseña
          - textbox "Contraseña" [ref=e16]: TestPassword123!
      - button "Iniciar Sesión" [ref=e18] [cursor=pointer]
      - generic [ref=e19]:
        - text: ¿No tienes cuenta?
        - link "Regístrate" [ref=e20]:
          - /url: /register
  - alert [ref=e21]
```