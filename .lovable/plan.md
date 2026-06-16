Remove the `GPTBot` block from `public/robots.txt` so OpenAI's crawler can access the site.

Current state (lines 22-23):
```
User-agent: GPTBot
Disallow: /
```

Action: delete those two lines.

Result: GPTBot will fall through to the final `User-agent: *` block which allows all paths.