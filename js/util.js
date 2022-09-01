function extractParams(paramStr) {
  let result = {};

  if (paramStr) {
    let params = paramStr.split("&");
    params.forEach(function (currParam) {
      if (currParam) {
        let paramTokens = currParam.split("=");
        let paramName = paramTokens[0];
        let paramValue = paramTokens[1];
        if (paramName) {
          paramName = decodeURIComponent(paramName);
          paramValue = paramValue ? decodeURIComponent(paramValue) : null;

          if (!result.hasOwnProperty(paramName)) {
            result[paramName] = paramValue;
          } else if (Array.isArray(result[paramName])) {
            result[paramName].push(paramValue);
          } else {
            result[paramName] = [result[paramName], paramValue];
          }
        }
      }
    });
  }

  return result;
}

function getEmbeddingPCEnv() {
  let result = null;

  if (
    window.location.hash &&
    window.location.hash.indexOf("access_token") >= 0
  ) {
    let oauthParams = extractParams(window.location.hash.substring(1));
    if (oauthParams && oauthParams.access_token && oauthParams.state) {
      let stateSearch = unescape(oauthParams.state);
      result = extractParams(stateSearch).pcEnvironment;
    }
  }

  if (!result && window.location.search) {
    result =
      extractParams(window.location.search.substring(1)).pcEnvironment || null;
  }

  return result;
}

function authenticate(client, pcEnvironment) {
  const platformEnvironment =
    pcEnvironment === "localhost" ? "mypurecloud.com" : pcEnvironment;
  //const clientId= '07b3db2c-98af-460a-84fd-fb2ba29f6af9'    //LATAM CHILE                    '
  const clientId = "48c2b235-9b0e-44d6-8d85-002f6d1b6a9e";
  if (!clientId) {
    const defaultErr =
      platformEnvironment + ": Unknown/Unsupported Genesys Cloud Environment";
    const localErr = `
            The host app is running locally and the target platform client environment was mapped to '${platformEnvironment}'.
            Ensure that you have an oauth client specified for this environment.
        `;
    return Promise.reject(
      new Error(pcEnvironment === "localhost" ? localErr : defaultErr)
    );
  }
  client.setEnvironment(platformEnvironment);
  client.setPersistSettings(true);
  const { origin, protocol, host, pathname } = window.location;
  const redirectUrl = (origin || `${protocol}//${host}`) + pathname;
  return client
    .loginImplicitGrant(clientId, redirectUrl, {
      state: `pcEnvironment=${pcEnvironment}`,
    })
    .then((data) => {
      window.history.replaceState(null, "", `${pathname}?${data.state}`);
    });
}
