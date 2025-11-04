<%@ Page Language="C#" %>
<%@ Import Namespace="System.Web.Script.Serialization" %>
<%
    // ============================================
    // ENDPOINT /whoami.aspx
    // ============================================
    // Gestito direttamente da IIS
    // Restituisce l'username dell'utente autenticato Windows
    // ============================================
    
    Response.ContentType = "application/json";
    Response.Cache.SetCacheability(HttpCacheability.NoCache);
    Response.Cache.SetExpires(DateTime.UtcNow.AddMinutes(-1));
    Response.Cache.SetNoStore();
    
    string username = "";
    string domain = "";
    string fullUsername = "";
    
    if (Request.IsAuthenticated && User.Identity.IsAuthenticated)
    {
        fullUsername = User.Identity.Name; // Es: GDFNET\J972537
        
        if (fullUsername.Contains("\\"))
        {
            string[] parts = fullUsername.Split('\\');
            domain = parts[0];
            username = parts[1];
        }
        else
        {
            username = fullUsername;
        }
    }
    
    // Usa JavaScriptSerializer invece di Newtonsoft.Json (già disponibile in .NET)
    var response = new System.Collections.Generic.Dictionary<string, object>
    {
        { "success", true },
        { "authenticated", Request.IsAuthenticated },
        { "username", username },
        { "domain", domain },
        { "fullUsername", fullUsername },
        { "timestamp", DateTime.UtcNow.ToString("o") }
    };
    
    var serializer = new JavaScriptSerializer();
    string json = serializer.Serialize(response);
    Response.Write(json);
%>
