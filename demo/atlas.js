goog.provide('atlas');
goog.provide('atlas.Data');
goog.provide('atlas.Page');
goog.provide('atlas.Site');

/**
 * @constructor
 */
atlas.Page = function ()
{
	var page = this;
	page.name = "";
	page.w = 0;
	page.h = 0;
	page.format = "RGBA8888";
	page.min_filter = "linear";
	page.mag_filter = "linear";
	page.wrap_s = "clamp-to-edge";
	page.wrap_t = "clamp-to-edge";
}

/**
 * @constructor
 */
atlas.Site = function ()
{
	var site = this;
	site.page = null;
	site.x = 0;
	site.y = 0;
	site.w = 0;
	site.h = 0;
	site.rotate = false;
	site.offset_x = 0;
	site.offset_y = 0;
	site.original_w = 0;
	site.original_h = 0;
	site.index = -1;
}

/**
 * @constructor
 */
atlas.Data = function ()
{
	var data = this;
	data.pages = [];
	data.sites = {};
}

/**
 * @return {atlas.Data}
 * @param {string} text
 */
atlas.Data.prototype.import = function (text)
{
	var lines = text.split(/\n|\r\n/);
	return this.importLines(lines);
}

/**
 * @return {string}
 * @param {string=} text
 */
atlas.Data.prototype.export = function (text)
{
	var lines = this.exportLines([])
	return (text || "") + lines.join('\n');
}

/**
 * @return {atlas.Data}
 * @param {Array.<string>} lines
 */
atlas.Data.prototype.importLines = function (lines)
{
	var data = this;

	data.pages = [];
	data.sites = {};

	function trim (s) { return s.replace(/^\s+|\s+$/g, ""); }

	var page = null;
	var site = null;

	var match = null;

	lines.forEach(function (line)
	{
		if (trim(line).length === 0)
		{
			page = null;
			site = null;
		}
		else if (match = line.match(/^size: (.*),(.*)$/))
		{
			page.w = parseInt(match[1], 10);
			page.h = parseInt(match[2], 10);
		}
		else if (match = line.match(/^format: (.*)$/))
		{
			page.format = match[1];
		}
		else if (match = line.match(/^filter: (.*),(.*)$/))
		{
			page.min_filter = match[1];
			page.mag_filter = match[2];
		}
		else if (match = line.match(/^repeat: (.*)$/))
		{
			var repeat = match[1];
			page.wrap_s = ((repeat === 'x') || (repeat === 'xy'))?('Repeat'):('ClampToEdge');
			page.wrap_t = ((repeat === 'y') || (repeat === 'xy'))?('Repeat'):('ClampToEdge');
		}
		else if (match = line.match(/^orig: (.*)[,| x] (.*)$/))
		{
			var original_w = parseInt(match[1], 10);
			var original_h = parseInt(match[2], 10);
			console.log("page:orig", original_w, original_h);
		}
		else if (page === null)
		{
			page = new atlas.Page();
			page.name = line;
			data.pages.push(page);
		}
		else
		{
			if (match = line.match(/^  rotate: (.*)$/))
			{
				site.rotate = (match[1] !== 'false');
			}
			else if (match = line.match(/^  xy: (.*), (.*)$/))
			{
				site.x = parseInt(match[1], 10);
				site.y = parseInt(match[2], 10);
			}
			else if (match = line.match(/^  size: (.*), (.*)$/))
			{
				site.w = parseInt(match[1], 10);
				site.h = parseInt(match[2], 10);
			}
			else if (match = line.match(/^  orig: (.*), (.*)$/))
			{
				site.original_w = parseInt(match[1], 10);
				site.original_h = parseInt(match[2], 10);
			}
			else if (match = line.match(/^  offset: (.*), (.*)$/))
			{
				site.offset_x = parseInt(match[1], 10);
				site.offset_y = parseInt(match[2], 10);
			}
			else if (match = line.match(/^  index: (.*)$/))
			{
				site.index = parseInt(match[1], 10);
			}
			else
			{
				if (site)
				{
					site.original_w = site.original_w || site.w;
					site.original_h = site.original_h || site.h;
				}
				
				site = new atlas.Site();
				site.page = page;
				data.sites[line] = site;
			}
		}
	});

	return data;
}

/**
 * @return {string}
 * @param {Array.<string>=} lines
 */
atlas.Data.prototype.exportLines = function (lines)
{
	lines = lines || [];

	var data = this;

	data.pages.forEach(function (page)
	{
		lines.push(""); // empty line denotes new page
		lines.push(page.name);
		lines.push("size: " + page.w + "," + page.h);
		lines.push("format: " + page.format);
		lines.push("filter: " + page.min_filter + "," + page.mag_filter);
		var repeat = 'none';
		if ((page.wrap_s === 'Repeat') && (page.wrap_t === 'Repeat')) { repeat = 'xy'; }
		if (page.wrap_s === 'Repeat') { repeat = 'x'; }
		if (page.wrap_t === 'Repeat') { repeat = 'y'; }
		lines.push("repeat: " + repeat);

		for (var site_key in data.sites)
		{
			var site = data.sites[site_key];
			if (site.page !== page) { continue; }
			lines.push(site_key);
			lines.push("  rotate: " + (site.rotate?'true':'false'));
			lines.push("  xy: " + site.x + ", " + site.y);
			lines.push("  size: " + site.w + ", " + site.h);
			lines.push("  orig: " + site.original_w + ", " + site.original_h);
			lines.push("  offset: " + site.offset_x + ", " + site.offset_y);
			lines.push("  index: " + site.index);
		}
	});

	return lines;
}
