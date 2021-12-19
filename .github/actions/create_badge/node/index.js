const fs = require('fs');
const core = require("@actions/core");

function create_badge(){

    var result = core.getInput('result-cypress');
    var badge = "<!---badge---> <!---badge--->";
    
    if(result == "failure"){
        badge = "<!---badge---> \n ![Generic badge](https://img.shields.io/badge/test-failure-red) \n <!---badge--->";
    }else if(result == "success"){
        badge = "<!---badge---> \n ![Generic badge](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg) \n <!---badge--->";
    }
    
    fs.readFile('./README.md', 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }

        var result = data.replace(/\<\!\-\-\-badge\-\-\-\>((.|[\n|\r|\r\n])*?)\<\!\-\-\-badge\-\-\-\>[\n|\r|\r\n]?(\s+)?/g, badge);

        fs.writeFile('./README.md', result, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    });
    
}

create_badge();

