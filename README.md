# Práctica Github Actions

Esta práctica consistirá en aplicar una serie de mejoras sobre un proyecto creado con el framework next.js [link](https://nextjs.org/) y que podéis descargar del siguiente repositorio de github [link](https://github.com/dawEstacio/nextjs-blog-practica). Para ello, partiendo de este código, deberéis crear un repositorio en vuestra cuenta de github y realizar las siguientes modificacione:

Crear un workflow (nombre_repositorio_workflow) de github Actions con los siguientes jobs:

## 2.Linter_job
Se encargará de ejecutar el linter que ya está instalado en el proyecto (existe un script para ello en el package.json) para verificar que la sintaxis utilizada es la correcta en todos los ficheros javascript. En caso de que existan errores corregirlos hasta que el job se ejecute sin problemas.

```
    Linter_job:
        runs-on: ubuntu-latest
        steps: 
        - name: Checkout
        uses: actions/checkout@v2.4.0
        - name: Lint
        run: |
            npm install
            npm run lint
```
## 3.Cypress_job
Se encargará de ejecutar los tests de cypress [link](https://www.cypress.io/) que contiene el proyecto. Para ello, utilizar la action oficial del proyecto [link](https://github.com/cypress-io/github-action). 
Este job se ejecutará después del Linter_job, esta compuesto por los siguientes steps:
- El encargado de realizar el checkout del código
- El encargado de ejecutar los tests de cypress y que aunque se produzca un error continue utilizar:
```
continue-on-error: true
```
- El encargado de crear un artefacto (result.txt) que contendrá la salida del step anterior

### 3.1.Añadir al workflow
```
    Cypress_job:
        needs: Linter_job
        runs-on: ubuntu-latest
        steps:
        - name: Checkout
        uses: actions/checkout@v2.4.0
        - name: Cypress 
        id: cypress
        uses: cypress-io/github-action@v2
        continue-on-error: true
        with:
            config-file: cypress.json
            build: npm run build
            start: npm start
        env:
            GITHUB_TOKEN: ${{ secrets.TOKEN_GITHUB }}
        - name: Create result.txt
        run: echo ${{ steps.cypress.outcome}} > result.txt
        - name: Upload Artifact
        uses: actions/upload-artifact@v2
        with:
            name: result.txt
            path: result.txt
```

## 4.Add_badge_job
Se encargará de publicar en el readme del proyecto el badge que indicará si se han superado los tests de cypress o no. Esta compuesto por los siguientes steps:
- El encargado de realizar el checkout del código
- El encargado de obtener los artefactos almacenados en el job anterior
- Un step encargado de generar un output partiendo de la lectura del artefacto recuperado. Básicamente ejecutará la instrucción 
```
echo "::set-output name=cypress_outcome::$(cat result.txt)"
```
- Un step que ejecuta una action. Esta action recibirá como parámetro de entrada el output generado por el step anterior y, dependiendo de si es “failure” o “success”, modificará el README.md del proyecto añadiendo uno de los siguientes badges al final del mismo y tras el texto “RESULTADO DE LOS ÚLTIMOS TESTS”:
    - (Failure) https://img.shields.io/badge/test-failure-red
    - (Success) https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg
- Step encargado de publicar el cambio del README.md en el repositorio

### 4.1.Crear de action.yml

```
    name: "Cypress Badge"
    description: "Add Cypress Badge"
    inputs:
        result-cypress:
            description: 'Cypress result'
            required: true
    runs:
        using: "node12"
        main: 'index.js'
```

### 4.2.Crear Index.js 

```
const fs = require('fs');
const core = require("@actions/core");

function create_badge(){

    var result = core.getInput('result-cypress');
    var badge = "";
    
    if(result == "failure"){
        badge = "![Generic badge](https://img.shields.io/badge/test-failure-red)";
    }else if(result == "success"){
        badge = "![Generic badge](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)";
    }
    
    fs.readFile('./README.md', 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }

        var result = data.replace(/\<\!\-\-\-badge\-\-\-\>((.|[\n|\r|\r\n])*?)\<\!\-\-\-badge\-\-\-\>[\n|\r|\r\n]?(\s+)?/g,"<!---badge--->
 ![Generic badge](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg) 
<!---badge--->");

        fs.writeFile('./README.md', result, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    });
    
}

create_badge();
```

### 4.3.Añadir al workflow
```
    Add_badge_job:
        needs: Cypress_job
        runs-on: ubuntu-latest
        steps:
        - name: Checkout
        uses: actions/checkout@v2.4.0
        - name: Download Artifact
        uses: actions/download-artifact@v2
        with:
            name: result.txt
        - name: Create Output
        id: cypress
        run: echo "::set-output name=cypress_outcome::$(cat result.txt)"
        - name: Create Badge
        uses: ./.github/actions/create_badge/
        with:
            result-cypress: ${{ steps.cypress.outputs.cypress_outcome }}
        - name: Push 
        run: |
            git config user.name jubelltols
            git config user.email jubelltols@gmail.com
            git pull
            git add .
            git commit -m "Update README.md"
            git push 
```


## 5.Deploy_job
Utilizando la action amondnet/vercel-action@v20, se encargara de publicar el proyecto en la plataforma vercel [link](https://vercel.com/). Se ejecutará tras el Cypress_job y estará formado por dos steps:
- El encargado de realizar el checkout del código
- El encargado de desplegar la aplicacińo en vercel que utilizará la action amondnet/vercel-action@v20

### 5.1.Crear cuenta vercel y obtener token de vercel

![token vercel](https://github.com/jubelltols/githubActions/blob/master/img/img%20(2).png)

### 5.2.Instalar Vercel localmente
```
npm i vercel
```
### 5.3.Linkear el proyecto a vercel
```
npx vercel link o vercel
```
### 5.4.Añadir secretos Github Actions

![github secrets](https://github.com/jubelltols/githubActions/blob/master/img/img%20(3).png)

### 5.5.Añadir al workflow
```
    Deploy_job:
        needs: Cypress_job
        runs-on: ubuntu-latest
        steps:
        - name: Checkout
        uses: actions/checkout@v2.4.0
        - name: Vercel
        uses: amondnet/vercel-action@v20
        with:
            working-directory: ./
            vercel-token: ${{ secrets.VERCEL_TOKEN }} 
            vercel-org-id: ${{ secrets.ORG_ID }} 
            vercel-project-id: ${{ secrets.PROJECT_ID }}
```
### 5.5.Link al despliege de la aplicación

[link](https://nextjs-blog-practica.vercel.app/)

## 6.Notification_job: 
Job de envío de notificación a los usuarios del proyecto. Se ejecutará siempre (aunque se haya producido un error en algún job previo), y se encargará de enviar un correo con:

* Destinatario: dirección de correo vuestra personal tomada de un secret de github
* Asunto: Resultado del workflow ejecutado
* Cuerpo del mensaje:
    Se ha realizado un push en la rama main que ha provocado la ejecución del
    workflow nombre_repositorio_workflow con los siguientes resultados:
    - linter_job: resultado asociado
    - cypress_job: resultado asociado
    - add_badge_job: resultado asociado
    - deploy_job: resultado asociado

### 6.1.Crear action.yml
Crear action.yml que contenga los inputs de todos los results y los secrets necesarios para enviar el correo.

```
    name: 'Send Email'
    description: 'Send a email with results'
    inputs:
        email:
            description: 'Email address'
            required: true
        password:
            description: 'Email password'
            required: true
        send_to:
            description: 'Email receive'
            required: true
        cypress:
            description: 'Cypress result'
            required: true
        linter:
            description: 'Linter result'
            required: true
        deploy:
            description: 'Deploy result'
            required: true
        badge:
            description: 'Badge result'
            required: true
    runs:
        using: "node12"
        main: 'index.js'
```

### 6.2.Crear index.js

```
const core = require('@actions/core');
const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: `${core.getInput('email')}`,
        pass: `${core.getInput('password')}`
    }
});

var mailOptions = {
    from: `${core.getInput('email')}`, 
    to: `${core.getInput('email')}`,
    subject: 'Resultado del workdflow ejecutado',
    html: `
    <div>   
        <p>Se ha realizado un push en la rama main que ha provocado la ejecución del workflow project_flow con los siguientes resultados: </p>
        <ul>
            <li>linter: ${core.getInput('linter')} </li>
            <li>cypress: ${core.getInput('cypress')} </li>
            <li>badge: ${core.getInput('badge')} </li>
            <li>deploy: ${core.getInput('deploy')} </li>
        </ul>
    </div>
    ` 
};

transporter.sendMail(mailOptions, function(error, info){
    if (error) {
        console.log(error);
    } else {
        console.log('Email sent: ' + info.response);
    }
});
```

### 6.3.Añadir los secrets necesarios a github para el correcto funcionamiento de la action

![github secrets](https://github.com/jubelltols/githubActions/blob/master/img/img%20(3).png)

### 6.4.Crear una contraseña de aplicaion en gmail para poder permitir a nodemailer enviar el correo.

![contraseña de aplicaion en gmail](https://github.com/jubelltols/githubActions/blob/master/img/img%20(4).png)
![contraseña de aplicaion en gmail](https://github.com/jubelltols/githubActions/blob/master/img/img%20(5).png)

### 6.5.Añadir al workflow
```
    Notification_job:
        needs: [Linter_job, Cypress_job, Add_badge_job, Deploy_job]
        runs-on: ubuntu-latest
        if: always()
        steps:
        - name: Checkout
        uses: actions/checkout@v2.4.0
        - name: Send Email
        uses: ./.github/actions/send_email/
            with:
            email: ${{ secrets.EMAIL }}
            password: ${{ secrets.PASSWORD }}
            send_to: ${{ secrets.EMAIL }}
            linter: ${{ needs.Linter_job.result }}
            cypress: ${{ needs.Cypress_job.result }}
            badge: ${{ needs.Add_badge_job.result }}
            deploy: ${{ needs.Deploy_job.result }}
```
### 6.6.Correo electronico de los resultados de las actions
![correo rusltados](https://github.com/jubelltols/githubActions/blob/master/img/img%20(1).png)

# RESULTADO DE LOS ÚLTIMOS TESTS

<!---badge--->

<!---badge--->