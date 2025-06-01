// Initialize counter for node IDs
let i = 0;
let currentZoom = d3.zoomIdentity;

// Mind map data structure based on the image
const data = {
    name: "Transformer Models",
    children: [
        {
            name: "Model Architecture",
            children: [
                {
                    name: "Encoder-Decoder Structure",
                    children: [
                        { name: "Processes input sequence (e.g., English)" },
                        { name: "Outputs target sequence (e.g., French)" }
                    ]
                },
                {
                    name: "Attention Mechanisms",
                    children: [
                        { name: "Self-attention" },
                        { name: "Multi-head attention" },
                        { name: "Scaled dot-product attention" },
                        { name: "Cross-attention between encoder and decoder" }
                    ]
                },
                {
                    name: "Feed Forward Networks",
                    children: [
                        { name: "Two linear transformations with ReLU" },
                        { name: "Processes each position independently" },
                        { name: "Introduces non-linearity" }
                    ]
                }
            ]
        },
        {
            name: "Key Components",
            children: [
                {
                    name: "Input Embeddings",
                    children: [
                        { name: "Token embeddings" },
                        { name: "Positional encodings" },
                        { name: "Layer normalization" }
                    ]
                },
                {
                    name: "Attention Layers",
                    children: [
                        { name: "Query, Key, Value matrices" },
                        { name: "Attention weights calculation" },
                        { name: "Output projection" }
                    ]
                },
                {
                    name: "Training Process",
                    children: [
                        { name: "Masked language modeling" },
                        { name: "Next sentence prediction" },
                        { name: "Fine-tuning for specific tasks" }
                    ]
                }
            ]
        }
    ]
};

// Set up the SVG container with dynamic sizing
function getContainerSize() {
    const mindmapDiv = document.getElementById('mindmap');
    return {
        width: mindmapDiv.clientWidth,
        height: mindmapDiv.clientHeight
    };
}

// Calculate content bounds
function calculateContentBounds() {
    const nodes = root.descendants();
    if (nodes.length === 0) return { minX: 0, maxX: 800, minY: 0, maxY: 600 };

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    nodes.forEach(d => {
        const dims = getNodeDimensions(d);
        const nodeMinX = d.y - dims.width / 2;
        const nodeMaxX = d.y + dims.width / 2;
        const nodeMinY = d.x - dims.height / 2;
        const nodeMaxY = d.x + dims.height / 2;

        minX = Math.min(minX, nodeMinX);
        maxX = Math.max(maxX, nodeMaxX);
        minY = Math.min(minY, nodeMinY);
        maxY = Math.max(maxY, nodeMaxY);
    });

    return { minX, maxX, minY, maxY };
}

// Update SVG dimensions based on content
function updateSVGDimensions() {
    const bounds = calculateContentBounds();
    const containerSize = getContainerSize();
    
    // Add padding around content
    const padding = 100;
    const contentWidth = bounds.maxX - bounds.minX + (padding * 2);
    const contentHeight = bounds.maxY - bounds.minY + (padding * 2);
    
    // Calculate required SVG size considering zoom
    const scale = currentZoom.k;
    const scaledWidth = contentWidth * scale;
    const scaledHeight = contentHeight * scale;
    
    // Ensure minimum size is at least the container size
    const svgWidth = Math.max(scaledWidth + margin.left + margin.right, containerSize.width);
    const svgHeight = Math.max(scaledHeight + margin.top + margin.bottom, containerSize.height);
    
    // Update SVG dimensions
    d3.select("#mindmap svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);
    
    // Update background rect
    svg.select("rect")
        .attr("width", svgWidth - margin.left - margin.right)
        .attr("height", svgHeight - margin.top - margin.bottom);
}

const margin = { top: 40, right: 120, bottom: 40, left: 120 };
let size = getContainerSize();

// Create the SVG container with zoom support
const svg = d3.select("#mindmap")
    .append("svg")
    .call(d3.zoom()
        .scaleExtent([0.1, 3])
        .on("zoom", (event) => {
            currentZoom = event.transform;
            g.attr("transform", event.transform);
            // Update SVG size when zooming
            setTimeout(updateSVGDimensions, 10);
        }))
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Add a background rect to catch zoom events
svg.append("rect")
    .attr("fill", "none")
    .attr("pointer-events", "all");

// Create a group for the tree
const g = svg.append("g");

// Create the tree layout with more spacing
const tree = d3.tree()
    .nodeSize([70, 250]); // Increased spacing

// Create the root node and position it
const root = d3.hierarchy(data);
root.x0 = 0;
root.y0 = 0;

// Collapse all nodes initially
root.children.forEach(collapse);

// Handle window resize
window.addEventListener('resize', () => {
    updateSVGDimensions();
});

// Initial update
update(root);

// Function to collapse nodes
function collapse(d) {
    if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
    }
}

// Calculate node dimensions based on text length
function getNodeDimensions(d) {
    const minWidth = 100;
    const charWidth = 8; // Approximate width per character
    const symbolWidth = (d.children || d._children) ? 30 : 0; // Space for symbol if node has children
    const padding = 20; // Padding on both sides
    const width = Math.max(minWidth, (d.data.name.length * charWidth) + symbolWidth + padding);
    return {
        width: width,
        height: 40,
        symbolOffset: (width / 2) - (symbolWidth / 2) // Position symbol near the right edge
    };
}

// Update the visualization
function update(source) {
    const duration = 750;

    // Compute the new tree layout
    tree(root);

    const nodes = root.descendants();
    const links = root.links();

    // Normalize for fixed-depth
    nodes.forEach(d => {
        d.y = d.depth * 300; // Increased horizontal spacing between levels
    });

    // Update the nodes
    const node = g.selectAll(".node")
        .data(nodes, d => d.id || (d.id = ++i));

    // Enter new nodes
    const nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${source.y0},${source.x0})`)
        .on("click", (event, d) => {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            update(d);
        });

    // Add ellipse for the nodes
    nodeEnter.append("ellipse")
        .attr("class", d => d._children ? "node-collapsed" : "node-expanded")
        .attr("rx", d => getNodeDimensions(d).width / 2)
        .attr("ry", d => getNodeDimensions(d).height / 2)
        .attr("cx", 0)
        .attr("cy", 0);

    // Add labels for the nodes
    nodeEnter.append("text")
        .attr("class", "node-label")
        .attr("dy", ".35em")
        .attr("x", d => (d.children || d._children) ? -12 : 0) // Shift text left if there's a symbol
        .attr("text-anchor", "middle")
        .text(d => d.data.name)
        .style("fill-opacity", 1);

    // Add expand/collapse symbol for nodes with children
    nodeEnter.append("text")
        .attr("class", "node-symbol")
        .attr("dy", "0.35em")
        .attr("x", d => getNodeDimensions(d).symbolOffset)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(d => d.children || d._children ? "−" : "")
        .style("display", d => d.children || d._children ? "block" : "none");

    // Update the nodes
    const nodeUpdate = nodeEnter.merge(node);

    nodeUpdate.transition()
        .duration(duration)
        .attr("transform", d => `translate(${d.y},${d.x})`);

    // Update the node attributes
    nodeUpdate.select("ellipse")
        .attr("class", d => d.children ? "node-expanded" : "node-collapsed")
        .attr("rx", d => getNodeDimensions(d).width / 2)
        .attr("ry", d => getNodeDimensions(d).height / 2);

    // Update the expand/collapse symbol
    nodeUpdate.select(".node-symbol")
        .attr("x", d => getNodeDimensions(d).symbolOffset)
        .text(d => {
            if (d.children || d._children) {
                return d.children ? "−" : "+";
            }
            return "";
        })
        .style("display", d => d.children || d._children ? "block" : "none");

    // Remove any exiting nodes
    const nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", d => `translate(${source.y},${source.x})`)
        .remove();

    nodeExit.select("ellipse")
        .attr("rx", 1e-6)
        .attr("ry", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links
    const link = g.selectAll(".link")
        .data(links, d => d.target.id);

    // Enter any new links
    const linkEnter = link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", d3.linkHorizontal()
            .x(d => {
                const dims = getNodeDimensions(d);
                return source.y0 + (d.children || d._children ? -dims.width/2 : dims.width/2);
            })
            .y(d => source.x0));

    // Update the links
    const linkUpdate = linkEnter.merge(link);

    linkUpdate.transition()
        .duration(duration)
        .attr("d", d3.linkHorizontal()
            .x(d => {
                const dims = getNodeDimensions(d);
                return d.y + (d.children || d._children ? -dims.width/2 : dims.width/2);
            })
            .y(d => d.x));

    // Remove any exiting links
    link.exit().transition()
        .duration(duration)
        .attr("d", d3.linkHorizontal()
            .x(d => {
                const dims = getNodeDimensions(d);
                return source.y + (d.children || d._children ? -dims.width/2 : dims.width/2);
            })
            .y(d => source.x))
        .remove();

    // Store the old positions for transition
    nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
    });

    // Update SVG dimensions after content changes
    setTimeout(updateSVGDimensions, duration + 50);
}

// Download functionality
document.getElementById('downloadBtn').addEventListener('click', () => {
    // Get the SVG element
    const svg = document.querySelector('#mindmap svg');
    const svgClone = svg.cloneNode(true);
    
    // Get all CSS rules that apply to SVG elements
    const styleSheets = Array.from(document.styleSheets);
    const svgStyles = [];
    
    styleSheets.forEach(sheet => {
        try {
            const rules = Array.from(sheet.cssRules || sheet.rules);
            rules.forEach(rule => {
                if (rule.selectorText && (
                    rule.selectorText.includes('.node') ||
                    rule.selectorText.includes('.link') ||
                    rule.selectorText.includes('ellipse') ||
                    rule.selectorText.includes('text') ||
                    rule.selectorText.includes('svg')
                )) {
                    svgStyles.push(rule.cssText);
                }
            });
        } catch (e) {
            // Handle CORS issues with external stylesheets
            console.warn('Could not access stylesheet:', e);
        }
    });
    
    // Create a style element with the collected styles
    const styleElement = document.createElementNS('http://www.w3.org/1999/xhtml', 'style');
    styleElement.textContent = svgStyles.join('\n');
    
    // Insert the style element into the cloned SVG
    svgClone.insertBefore(styleElement, svgClone.firstChild);
    
    // Set SVG attributes for proper rendering
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    
    // Get the bounding box and set proper viewBox
    const bbox = svg.getBBox();
    const padding = 50;
    const viewBox = `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`;
    svgClone.setAttribute('viewBox', viewBox);
    
    // Create canvas with high resolution
    const canvas = document.createElement('canvas');
    const scaleFactor = 3; // High DPI scaling
    const canvasWidth = (bbox.width + padding * 2) * scaleFactor;
    const canvasHeight = (bbox.height + padding * 2) * scaleFactor;
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = bbox.width + padding * 2 + 'px';
    canvas.style.height = bbox.height + padding * 2 + 'px';
    
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Scale for high DPI
    ctx.scale(scaleFactor, scaleFactor);
    
    // Set white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasWidth / scaleFactor, canvasHeight / scaleFactor);
    
    // Convert SVG to string
    const svgString = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
        // Draw the image on canvas
        ctx.drawImage(img, 0, 0, bbox.width + padding * 2, bbox.height + padding * 2);
        
        // Convert to PNG with high quality
        const pngUrl = canvas.toDataURL('image/png', 1.0);
        
        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = 'transformer-mindmap.png';
        downloadLink.style.display = 'none';
        
        // Trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up
        URL.revokeObjectURL(url);
    };
    
    img.onerror = (error) => {
        console.error('Error loading SVG image:', error);
        alert('Error generating image. Please try again.');
        URL.revokeObjectURL(url);
    };
    
    img.src = url;
}); 
