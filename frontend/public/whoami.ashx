<%@ WebHandler Language="C#" Class="WhoAmI" %>

using System;
using System.Web;
using System.Collections.Generic;
using System.Web.Script.Serialization;

public class WhoAmI : IHttpHandler
{
    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json";
        context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
        context.Response.Cache.SetExpires(DateTime.UtcNow.AddMinutes(-1));
        context.Response.Cache.SetNoStore();
        
        string username = "";
        string domain = "";
        string fullUsername = "";
        
        if (context.Request.IsAuthenticated && context.User.Identity.IsAuthenticated)
        {
            fullUsername = context.User.Identity.Name;
            
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
        
        var response = new Dictionary<string, object>
        {
            { "success", true },
            { "authenticated", context.Request.IsAuthenticated },
            { "username", username },
            { "domain", domain },
            { "fullUsername", fullUsername },
            { "timestamp", DateTime.UtcNow.ToString("o") }
        };
        
        var serializer = new JavaScriptSerializer();
        string json = serializer.Serialize(response);
        context.Response.Write(json);
    }
    
    public bool IsReusable
    {
        get { return true; }
    }
}
