require 'rubygems'
require 'coderay'

html = File.read("skeleton.html")

puts CodeRay.scan(html, :html).div(:css => :class)