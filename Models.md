## collection User

| STT | Document | Validate |
|--------|------|---------|
| 0 | password | required, type: string, min: 7, max: 100 |
| 1 | email | required, min: 7, max: 200, type: email, unique, |
| 2 | firstname | required, type: string, min: 7, max: 100 |
| 3 | phone | type: phone,  min: 7, max: 15 |
| 4 | token | type: string,  max: 200 |
| 5 | address | type: string,  max: 200 |
| 6 | gender | type: number, in (0, 1) |
| 7 | status | type: number, in (0, 1) |
| 8 | permit | type: any |

## collection typeDocuments

| STT | Document | Validate |
|--------|------|---------|
| 0 | name | required, type: string, min: 3, max: 200 |
