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