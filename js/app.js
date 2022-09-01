const platformClient = require("platformClient");

var agentUserId = "";
const scriptId = "673f19cf-071e-4139-bb4e-7980ecf528fc";
const queueId = "723548df-b358-4330-b4b8-7362afb76078";
Vue.prototype.$clientApp = null;
Vue.prototype.$usersApi = null;
Vue.prototype.$conversationsApi = null;

const authenticatingComponent = {
  props: ["errorMessage", "authenticated"],
  template: "#authenticating-template",
};

const conversationsComponent = {
  props: ["conversationsData"],
  data: function () {
    return {
      message: "",
    };
  },
  methods: {
    sendWhatsapp: function () {
      generarCallBack(this.message);
    },
  },
  template: "#conversations-template",
};

new Vue({
  el: "#app",
  data: {
    profileData: {
      name: "Gabriel Amarillo",
      email: "",
      department: "",
    },
    conversationsData: {
      conversations: [],
    },
    errorMessage: "",
    authenticated: false,
  },
  components: {
    authenticating: authenticatingComponent,
    conversations: conversationsComponent,
  },

  beforeMount() {
    let pcEnvironment = getEmbeddingPCEnv();
    if (!pcEnvironment) {
      this.errorMessage =
        "Cannot identify App Embeddding context.  Did you forget to add pcEnvironment={{pcEnvironment}} to your app's query string?";
      return;
    }
    let client = platformClient.ApiClient.instance;
    let clientApp = null;
    try {
      clientApp = new window.purecloud.apps.ClientApp({
        pcEnvironment,
      });
      Vue.prototype.$clientApp = clientApp;
    } catch (e) {
      console.log(e);
      this.errorMessage =
        pcEnvironment + ": Unknown/Unsupported Genesys Cloud Embed Context";
      return;
    }

    const usersApi = new platformClient.UsersApi();
    const conversationsApi = new platformClient.ConversationsApi();
    Vue.prototype.$usersApi = usersApi;
    Vue.prototype.$conversationsApi = conversationsApi;
    let authenticated = false;

    authenticate(client, pcEnvironment)
      .then(() => {
        authenticated = true;
        return usersApi.getUsersMe({ expand: ["presence"] });
      })
      .then(async (profileData) => {
        this.profileData = profileData;
        agentUserId = profileData.id;
        try {
          this.authenticated = true;
        } catch (e) {
          console.error(e);
          this.errorMessage = "Failed to fetch conversations/evaluations";
        }
      })
      .catch((err) => {
        console.log(err);
        this.errorMessage = !authenticated
          ? "Failed to Authenticate with Genesys Cloud - " + err.message
          : "Failed to fetch/display profile";
      });
  },
});

async function generarCallBack(ani) {
  try {
    conversationsApi = new platformClient.ConversationsApi();
    const callbackData = {
      routingData: {
        queueId: queueId,
        preferredAgentIds: [agentUserId],
      },
      scriptId: scriptId,
      callbackUserName: "Whatsapp Saliente",
      callbackNumbers: [ani],
      data: {
        numeroWhatsapp: ani,
      },
      callerId: "",
      callerIdName: "",
    };
    return conversationsApi.postConversationsCallbacks(callbackData);
  } catch (e) {
    console.error(e);
    this.errorMessage = "Failed to Generate CallBack";
  }
}
