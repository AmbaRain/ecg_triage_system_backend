<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%
  String code = request.getParameter("code");
  if (code == null || code.isBlank()) code = "404";

  try {
    response.setStatus(Integer.parseInt(code));
  } catch (NumberFormatException ignored) {
    response.setStatus(404);
  }

  String title = request.getParameter("title");
  if (title == null || title.isBlank()) title = "Page Not Found";

  String heading = request.getParameter("heading");
  if (heading == null || heading.isBlank()) heading = "Signal lost";

  String message = request.getParameter("message");
  if (message == null || message.isBlank()) {
    message = "The page you're looking for doesn't exist or has been moved. Check the URL or navigate back to a known page.";
  }

  String primaryLabel = request.getParameter("primaryLabel");
  if (primaryLabel == null || primaryLabel.isBlank()) primaryLabel = "Dashboard";

  String primaryHref = request.getParameter("primaryHref");
  if (primaryHref == null || primaryHref.isBlank()) primaryHref = "dashboard.html";

  String secondaryLabel = request.getParameter("secondaryLabel");
  if (secondaryLabel == null || secondaryLabel.isBlank()) secondaryLabel = "← Go back";

  String secondaryHref = request.getParameter("secondaryHref");
  if (secondaryHref == null || secondaryHref.isBlank()) secondaryHref = "javascript:history.back()";

  String escCode = code.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;");
  String escTitle = title.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;");
  String escHeading = heading.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;");
  String escMessage = message.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;");
  String escPrimaryLabel = primaryLabel.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;");
  String escPrimaryHref = primaryHref.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;");
  String escSecondaryLabel = secondaryLabel.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;");
  String escSecondaryHref = secondaryHref.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;");
%>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="<%= escTitle %> — ECG Triage" />
    <title><%= escCode %> — <%= escTitle %> | ECG Triage</title>
    <link rel="stylesheet" href="./css/styles.css" />
    <style>
      .error-page {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: var(--space-8);
        background:
          radial-gradient(
            ellipse 60% 50% at 50% 50%,
            rgba(248, 81, 73, 0.05) 0%,
            transparent 70%
          ),
          var(--color-bg);
      }

      .error-page__inner {
        text-align: center;
        max-width: 480px;
      }

      .error-ecg {
        margin: 0 auto var(--space-8);
        width: 100%;
        max-width: 400px;
      }

      .error-ecg__label {
        font-family: var(--font-base);
        font-size: 6rem;
        font-weight: 700;
        color: var(--color-surface-raised);
        line-height: 1;
        letter-spacing: -4px;
        margin-bottom: var(--space-2);
      }

      .error-ecg svg {
        width: 100%;
        height: 60px;
      }

      .flatline-path {
        stroke: var(--color-danger);
        stroke-width: 2;
        fill: none;
        filter: drop-shadow(0 0 4px rgba(248, 81, 73, 0.4));
        stroke-dasharray: 600;
        stroke-dashoffset: 600;
        animation: draw-flatline 1.8s ease 0.4s forwards;
      }

      @keyframes draw-flatline {
        to {
          stroke-dashoffset: 0;
        }
      }

      .error-page__heading {
        font-size: 1.5rem;
        margin-bottom: var(--space-3);
      }

      .error-page__body {
        color: var(--color-text-secondary);
        font-size: 0.9375rem;
        margin-bottom: var(--space-8);
        line-height: 1.6;
      }

      .error-page__actions {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-3);
        flex-wrap: wrap;
      }
    </style>
  </head>
  <body>
    <div class="error-page" role="main">
      <div class="error-page__inner animate-fade-in">
        <div class="error-ecg" aria-hidden="true">
          <div class="error-ecg__label"><%= escCode %></div>
          <svg viewBox="0 0 400 60" preserveAspectRatio="none">
            <path
              class="flatline-path"
              d="M0,30 L80,30 L90,28 L98,5 L102,55 L110,30 L400,30"
            />
          </svg>
        </div>

        <h1 class="error-page__heading"><%= escHeading %></h1>
        <p class="error-page__body"><%= escMessage %></p>

        <div class="error-page__actions">
          <a href="<%= escPrimaryHref %>" class="btn btn--primary" id="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <%= escPrimaryLabel %>
          </a>
          <a href="<%= escSecondaryHref %>" class="btn btn--ghost" id="btn-secondary">
            <%= escSecondaryLabel %>
          </a>
        </div>
      </div>
    </div>
  </body>
</html>