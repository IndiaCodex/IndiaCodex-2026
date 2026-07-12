package com.medichain.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import java.io.IOException;

/**
 * SPA Filter — serves index.html for all non-API, non-static requests.
 * Runs OUTSIDE the Spring MVC dispatcher servlet so it works at root level.
 */
@Component
public class SpaController implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        String path = request.getRequestURI();

        // Pass through: API calls, static assets, actuator
        if (path.startsWith("/api/v1") ||
            path.startsWith("/assets/") ||
            path.startsWith("/actuator") ||
            path.contains(".js") ||
            path.contains(".css") ||
            path.contains(".ico") ||
            path.contains(".png") ||
            path.contains(".svg") ||
            path.contains(".woff") ||
            path.equals("/index.html")) {
            chain.doFilter(req, res);
            return;
        }

        // Everything else → serve React's index.html
        ClassPathResource index = new ClassPathResource("static/index.html");
        if (index.exists()) {
            HttpServletResponse response = (HttpServletResponse) res;
            response.setContentType("text/html;charset=UTF-8");
            response.getOutputStream().write(index.getContentAsByteArray());
        } else {
            chain.doFilter(req, res);
        }
    }
}

