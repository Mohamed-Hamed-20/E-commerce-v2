export const WelocmeHtml = () => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        text-align: center;
        margin: 50px;
      }

      h1 {
        color: #333;
      }

      p {
        color: #666;
        margin: 20px 0;
      }

      a {
        color: #007BFF;
        text-decoration: none;
      }

      a:hover {
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <h1>Welcome to My API Service</h1>
    <br />
    <br />
    <p>
      Postman documentation content: -
      <a
        href="https://documenter.getpostman.com/view/27782301/2s9Ye8fup3"
        target="_blank"
        rel="noopener noreferrer"
        >documentation </a
      >
    </p>

    <p>
      Project on GitHub: -
      <a
        href="https://github.com/Mo2022Hamoo/ecommerce_deploy"
        target="_blank"
        rel="noopener noreferrer"
        >E-commerce link</a
      >
    </p>
  </body>
</html>
`;
};

export const hellowpage = async () => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mohamed Hamed Portfolio</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #333;
            color: #fff;
        }
        .container {
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background-color: #444;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: row-reverse;
            align-items: flex-start;
        }
        .content {
            flex-grow: 1;
            padding: 0 20px;
        }
        .content h4 {
            font-size: 24px;
            margin-bottom: 20px;
            text-align: left;
        }
        .content p {
            font-size: 16px;
            margin-bottom: 10px;
            text-align: left;
        }
        .link-container {
            margin-bottom: 20px;
            text-align: left;
        }
        .link-container a {
            display: inline-block;
            margin-right: 10px;
            padding: 10px 20px;
            border-radius: 5px;
            background-color: #007bff;
            color: #fff;
            text-decoration: none;
            transition: background-color 0.3s, color 0.3s;
        }
        .link-container a:hover {
            background-color: #0056b3;
        }
.social-icons {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.social-icons a {
    display: inline-block;
    margin-right: 20px;
    font-size: 14px;
    color: #fff;
    background-color: #4CAF50; 
    width: auto; 
    height: 40px;
    line-height: 40px;
    text-align: center;
    text-decoration: none;
    transition: background-color 0.3s, color 0.3s;
    padding: 0 10px; 
    border-radius: 5px; 
}

.social-icons a:hover {
    background-color: #45a049;
}




        .social-icons a:hover {
            background-color: #0056b3;
        }
        img {
            max-width: 200px;
            border-radius: 10px;
            margin-right: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="content">
            <h4>Welcome to My API Services</h4>
            <div class="link-container">
                <a href="${process.env.Apidoc}"  target="_blank">View API project documentation</a>
                <a href="${process.env.ProjectOnGithub}" target="_blank">View full project on GitHub</a>
            </div>
            <h2><span>${process.env.Myname}</span></h2>
            <p>Title: Backend Node.js Developer</p>
            <p>Email: ${process.env.useremail} </p>
            <p>Location: ${process.env.location}</p>
            <div class="social-icons">
                <a href="${process.env.GitHub}" target="_blank">GitHub</a>
                <a href="${process.env.linkedIn}" target="_blank">LinkedIn</a>
            </div>
        </div>
        <img src="${process.env.profileImg}" alt="Mohamed Hamed">
    </div>
</body>
</html>

`;
};
