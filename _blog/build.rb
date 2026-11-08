# encoding: UTF-8
# Builds /blog/ from _blog/posts.rb and adds the Blog links to index.html.
# Header, footer and styles are taken from index.html so they stay in sync.
# Run from anywhere:  ruby _blog/build.rb
require "cgi"
require "date"
require "fileutils"
require_relative "posts"

ROOT = File.expand_path("..", __dir__)
SITE = "https://cracktech.app"

def read(path) File.read(File.join(ROOT, path), encoding: "UTF-8") end
def write(path, text)
  full = File.join(ROOT, path)
  FileUtils.mkdir_p(File.dirname(full))
  File.write(full, text, encoding: "UTF-8")
end
def h(text) CGI.escapeHTML(text) end
def nice_date(iso) Date.parse(iso).strftime("%-d %b %Y") end

# Homepage: add the Blog links once.
home = read("index.html")
unless home.include?('href="/blog/"')
  home = home.sub(%r{(<li><a href="#faq">FAQ</a></li>\n)(\s*</ul>\s*</nav>)}) { "#{$1}        <li><a href=\"/blog/\">Blog</a></li>\n#{$2}" }
  home = home.sub(%r{(<a class="m" href="#faq">FAQ <span>05</span></a>\n)}) { "#{$1}    <a class=\"m\" href=\"/blog/\">Blog <span>06</span></a>\n" }
  home = home.sub(%r{<li><a href="#faq">FAQ</a></li></ul>}, '<li><a href="#faq">FAQ</a></li><li><a href="/blog/">Blog</a></li></ul>')
  abort "Could not add all Blog links to index.html" unless home.scan('href="/blog/"').size == 3
  write("index.html", home)
end

# Shared pieces, with same-page links pointed back at the homepage.
def relink(html)
  html.gsub('href="#top"', "\0TOP\0").gsub('href="#"', 'href="/"').gsub(/href="#([a-z])/, 'href="/#\1').gsub("\0TOP\0", 'href="#top"')
end
css = home[%r{<style>(.*?)</style>}m, 1]
favicon = home[/<link rel="icon"[^>]*>/]
header = relink(home[%r{<header id="top">.*?</header>}m]).sub('<li><a href="/blog/">Blog</a></li>', '<li><a href="/blog/" class="active" aria-current="page">Blog</a></li>')
fabs = home[%r{<a id="mail-fab".*?</a>\s*<a id="wa-fab".*?</a>}m]
footer = relink(home[%r{<footer>.*?</footer>}m])
beacon = home[%r{<script defer src="https://static\.cloudflareinsights\.com.*?</script>}]
write("blog/site.css", css)
write("blog/blog.css", read("_blog/blog.css"))
write("blog/blog.js", read("_blog/blog.js"))
# Images stored with the site (e.g. covers not hosted on Medium's CDN)
Dir[File.join(ROOT, "_blog/images/*")].each { |f| FileUtils.mkdir_p(File.join(ROOT, "blog/images")); FileUtils.cp(f, File.join(ROOT, "blog/images", File.basename(f))) }

page = lambda do |title:, description:, path:, image: nil, type: "website", body:|
  og_image = image ? %(\n<meta property="og:image" content="#{h(image)}">) : ""
  <<~HTML
    <!DOCTYPE html>
    <html lang="en" data-theme="dark">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>#{h(title)}</title>
    <meta name="description" content="#{h(description)}">
    <link rel="canonical" href="#{SITE}#{path}">
    <meta property="og:type" content="#{type}">
    <meta property="og:title" content="#{h(title)}">
    <meta property="og:description" content="#{h(description)}">
    <meta property="og:url" content="#{SITE}#{path}">#{og_image}
    <meta name="theme-color" content="#13150e">
    <script>try{if(localStorage.getItem("ct-theme")==="light")delete document.documentElement.dataset.theme}catch(e){}</script>
    #{favicon}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/blog/site.css">
    <link rel="stylesheet" href="/blog/blog.css">
    </head>
    <body>
    <a class="skip" href="#main">Skip to content</a>
    #{header}
    <main id="main">
    #{body}
    </main>
    #{fabs}
    #{footer}
    <script src="/blog/blog.js"></script>
    #{beacon}
    </body>
    </html>
  HTML
end

# A post's optional video: a YouTube link or 11-character video ID.
def youtube_id(post)
  return nil unless post[:youtube]
  id = post[:youtube][%r{(?:v=|youtu\.be/|embed/|shorts/|live/)([\w-]{11})}, 1] || post[:youtube]
  abort "Unrecognised YouTube link for #{post[:slug]}: #{post[:youtube]}" unless id.match?(/\A[\w-]{11}\z/)
  id
end

def meta(post)
  video = youtube_id(post) ? %(<span class="vid">▶ Video</span>) : ""
  %(<div class="post-meta"><span class="cat">#{h(post[:category])}</span><time datetime="#{post[:date]}">#{nice_date(post[:date])}</time><span>#{post[:minutes]} min read</span>#{video}</div>)
end

posts = POSTS.sort_by { |p| p[:date] }.reverse
categories = posts.map { |p| p[:category] }.uniq

# List page
filter_buttons = [%(<button class="filter" type="button" data-filter="all" aria-pressed="true">All<span>#{posts.size}</span></button>)] +
  categories.map { |c| %(<button class="filter" type="button" data-filter="#{h(c)}" aria-pressed="false">#{h(c)}<span>#{posts.count { |p| p[:category] == c }}</span></button>) }
cards = posts.map do |p|
  <<~HTML
    <a class="post-card" href="/blog/#{p[:slug]}/" data-category="#{h(p[:category])}">
      <img src="#{h(p[:image])}" alt="" width="1024" height="576" loading="lazy">
      <div class="post-body">
        #{meta(p)}
        <h2>#{h(p[:title])}</h2>
        <p>#{h(p[:teaser])}</p>
        <span class="post-more">Read summary →</span>
      </div>
    </a>
  HTML
end
write("blog/index.html", page.call(
  title: "Blog — Crack Tech",
  description: "Short, practical guides to system design and agentic AI interviews, from Crack Tech. Read the summary, then the full article on Medium.",
  path: "/blog/",
  body: <<~HTML
    <div class="wrap">
      <div class="blog-head">
        <div class="kicker">Blog</div>
        <h1>Learn how interviewers <em>think.</em></h1>
        <p class="lede">Practical guides to system design and agentic AI interviews. Start with the short summary, then read the full article on Medium.</p>
      </div>
      <div class="filters" role="group" aria-label="Filter by category">#{filter_buttons.join}</div>
      <div class="post-grid">
    #{cards.join}
      </div>
    </div>
  HTML
))

# One summary page per article
posts.each do |p|
  paragraphs = p[:summary].map { |s| "<p>#{h(s)}</p>" }.join("\n")
  points = p[:takeaways].map { |t| "<li><span>#{h(t)}</span></li>" }.join("\n")
  video = ""
  if (id = youtube_id(p))
    video = <<~HTML
      <section class="article-video" aria-label="Video walkthrough">
        <h2>Watch the walkthrough</h2>
        <div class="video"><iframe src="https://www.youtube-nocookie.com/embed/#{id}" title="#{h(p[:video_title] || p[:title])}" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>
        #{p[:video_note] ? %(<p class="note">#{h(p[:video_note])}</p>) : ""}
      </section>
    HTML
  end
  write("blog/#{p[:slug]}/index.html", page.call(
    title: "#{p[:title]} — Crack Tech",
    description: p[:teaser],
    path: "/blog/#{p[:slug]}/",
    image: p[:image],
    type: "article",
    body: <<~HTML
      <div class="wrap">
        <article class="article">
          <a class="back" href="/blog/">← All articles</a>
          #{meta(p)}
          <h1>#{h(p[:title])}</h1>
          <img class="article-cover" src="#{h(p[:image])}" alt="" width="1024" height="576">
          <div class="article-summary">
      #{paragraphs}
          </div>
      #{video}    <section class="takeaways" aria-label="Key takeaways">
            <h2>Key takeaways</h2>
            <ul>
      #{points}
            </ul>
          </section>
          <div class="article-read">
            <a class="btn btn-primary" href="#{h(p[:medium])}" target="_blank" rel="noopener">Read the full article on Medium <span class="arr">→</span></a>
            <p class="note">#{p[:minutes]} min read. Opens in a new tab.</p>
          </div>
          <div class="article-cta">
            <h2>Preparing for interviews?</h2>
            <p>Talk through where you stand and what to work on next.</p>
            <a class="btn btn-outline" href="/#book">Book a free 15-min call</a>
          </div>
        </article>
      </div>
    HTML
  ))
end

puts "Built #{posts.size} articles in blog/"
