const express = require('express');
const fetch = require('node-fetch');
const cookieSession = require('cookie-session');
const cors = require('cors');
const fleek = require('@fleekhq/fleek-storage-js');   

const app = express();

require('dotenv').config()


const client_id = process.env.GITHUB_CLIENT_ID;

const client_secret = process.env.GITHUB_CLIENT_SECRET;

const cookie_secret = process.env.COOKIE_SECRET;

const fleek_api_key = process.env.FLEEK_API_KEY;

const fleek_api_secret = process.env.FLEEK_API_SECRET;



console.log({
    client_id, client_secret
})

// app.use(cookieSession({
//     secret: cookie_secret
// }))

app.get('/api', (req, res) => {
    res.json("GITUB AUTH")
})

async function getAccessToken (code) {
    console.log(client_id,
        client_secret,
        code);
    const request = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": 'http://localhost:3001',
          'Access-Control-Allow-Credentials' : 'true'
        },
        body: JSON.stringify({
          client_id,
          client_secret,
          code
        })
      });
      const text = await request.text();
      const params = new URLSearchParams(text);
      console.log(params)
      return params.get("access_token");
}

async function getGitHubUser(access_token) {
    const request = await fetch('https://api.github.com/user', {
        headers : {
            Authorization: `bearer ${access_token}`
        }
    })

    const data = await request.json();
    console.log("getGitHubUser", data);
    return data;
}

app.get('/login', cors(), (req, res) => {
    let url = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=http://localhost:3000/callback`;
    res.redirect(url);
})
app.get('/getUsername', cors(), async (req, res) => {
    const code = req.query.code;
    // res.send("GITHUB CALLBACK")

    // console.log("callback", code);
    const token = await getAccessToken(code);
    const githubData = await getGitHubUser(token);

    if (githubData) {
        // req.session.githubId = githubData.id;
        // req.session.token = githubData.token;

        const username = githubData.login;

        res.send({ username });
    }
    else {
        res.send("Error")
    }
});

app.get('/getData', cors(), async (req, res) => {
    const code = req.query.code;
    // res.send("GITHUB CALLBACK")

    // console.log("callback", code);
    const token = await getAccessToken(code);
    const githubData = await getGitHubUser(token);

    console.log(githubData);

    if (githubData) {
        // req.session.githubId = githubData.id;
        // req.session.token = githubData.token;

        const repos = await getRespositories(githubData.login);

        res.send({ repos, githubData });
    }
    else {
        res.send("Error")
    }

//    res.json({githubData})

})

async function getRespositories(login) {
    // console.log(login);

    const repositories = await fetch(`https://api.github.com/users/${login}/repos`, {
        headers: {
            "Content-Type": "application/json"
          }
    })

    const data = await repositories.json();
    // console.log(data);
    return data;
}

app.get('/getdb', cors(), async(req, res) => {
    const repo_id = req.query.repo_id;

    const data = await getFleekData(repo_id);

    res.send({data})
})

// app.get('/getRepoData', cors(), async(req, res) => {
//     const repoUsername = req.query.username;
//     const repoName = req.query.name;


//     const data = await getRepoData(repoUsername, repoName);
// })

// async function getRepoData (repoUsername, repoName) {
//     const data = await fetch(`https://api.github.com/repos/${repoUsername}/${repoName}`, {
//         headers: {
//             "Content-Type": "application/json"
//           }
//     })
   
//     const repoData = await data.json();

//     console.log(repoData);
// }
 
// app.get('/getContractAddress', cors(), async(req, res) => {
//     const repo_id = req.query.repo_id;

//     const data = await getContractAddressData(repo_id);

//     res.send({data})
// })

// async function getContractAddressData (repo_id) {
//     const input = {
//         apiKey: fleek_api_key,
//         apiSecret: fleek_api_secret,
//         key: `${repo_id}`,
//         getOptions: ['hash', 'data', 'publicUrl', 'key']
//       };
    
//       const result = await fleek.get(input);

//       console.log(result);

//       return result;
// }


app.get('/setdb', cors(), async (req, res) => {
    const repo_id = req.query.repo_id;
    const contract_address = req.query.contract_address;
    
    const setData = await setFleekData(repo_id, contract_address);

    res.send({setData})
})

async function getFleekData (repo_id) {
    const input = {
        apiKey: fleek_api_key,
        apiSecret: fleek_api_secret,
        getOptions: ['key'],
      };
    
      const result = await fleek.listFiles(input);

      console.log(result);

      return result;
}


async function setFleekData (repo_id, contract_address) {
    const input = {
        apiKey: fleek_api_key,
        apiSecret: fleek_api_secret,
        key: `${repo_id}`,
        data: `${contract_address}`,
      };
    
      const result = await fleek.upload(input);

      return result;
}

app.get('/admin', cors(), (req, res) => {
    res.send("WASSSUP");
})

const PORT = process.env.port || 9014;

app.listen(PORT, () => console.log("Listening"));