//requires opencv.js to run!
const MAX_ITEMS = 100000;

var imgElement = document.getElementById('imageSrc');
var canvasElement = document.getElementById('canvasOutput');
var inputElement = document.getElementById('fileInput');

var initialImageElem = document.getElementById('im2');
initialImageElem.click();

//var state = {};
var state = {
colors: [],
    areas: [],
    centroids: [],
    bboxes: [],
    distances: {},
};

inputElement.addEventListener('change', (e) => {
imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);

/*
var edgeSlider = document.getElementById("sliderEdgeThreshold");
var edgeThreshValue = document.getElementById("edgeThreshValue");
edgeThreshValue.innerHTML = edgeSlider.value;
edgeSlider.oninput = function() {
edgeThreshValue.innerHTML = this.value;
}

var distSlider = document.getElementById("sliderProximityThreshold");
var proximityThreshValue = document.getElementById("proximityThreshValue");
proximityThreshValue.innerHTML = distSlider.value;
distSlider.oninput = function() {
proximityThreshValue.innerHTML = this.value;
}

var areaSlider = document.getElementById("sliderAreaThreshold");
var areaThreshValue = document.getElementById("areaThreshValue");
areaThreshValue.innerHTML = areaSlider.value;
areaSlider.oninput = function() {
areaThreshValue.innerHTML = this.value;
}

var colorSlider = document.getElementById("sliderColorThreshold");
var colorThreshValue = document.getElementById("colorThreshValue");
colorThreshValue.innerHTML = colorSlider.value;
colorSlider.oninput = function() {
colorThreshValue.innerHTML = this.value;
}
*/
function loadCanvas() {
    console.log('loadCanvas()');
    let src = cv.imread(imgElement);

    /*
        //don't need to resize here, can resize in <img> tag
       let dsize = new cv.Size(256, 256);
       cv.resize(src, src, dsize, 0, 0, cv.INTER_AREA);

       console.log('src size:', src.cols, src.rows);
       */
    //cv.imshow('canvasOutput', src);
    console.log('src size:', src.cols, src.rows);

    updateContours();

    src.delete();
    console.log('loadCanvas() exit');
}

function setImageSource(elem) {
    console.log("setImageSource", elem);
    imgElement.src = elem.src;

    //let fileInputElem = document.getElementById("fileInput");
    //fileInputElem.
}

function updateContours() {
    let src = cv.imread(imgElement);

    let dst = new cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);

    let boundingBoxes = new cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);
    let threshold = new cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);
    getContours(src, dst, boundingBoxes, threshold); 

    updateGestalt(); 

    cv.imshow('canvasOutput', dst);
    cv.imshow('canvasBoundingBoxes', boundingBoxes);
    cv.imshow('canvasThreshold', threshold);

    src.delete();
    dst.delete();
    boundingBoxes.delete();
    threshold.delete();

};

imgElement.onload = loadCanvas;


function getContours(src, dst, dst2, dst3) { //, colorIm, areaIm, distIm) {

    state = {colors: [],
            areas: [],
            centroids: [],
            bboxes: [],
            distances: {},
            contours: null,
        };


    let threshold = document.getElementById("sliderEdgeThreshold").value;
    threshold = Number.parseFloat(threshold);


    let gray = new cv.Mat();

    if (src.channels() == 3) {
        cv.cvtColor(src, gray, cv.COLOR_BGR2GRAY, 0);
    } else if (src.channels() == 4) {
        cv.cvtColor(src, gray, cv.COLOR_BGRA2GRAY, 0);
    } else {
        gray = src.clone();
    }

    //let cannyIm = new cv.Mat();
    cv.Canny(gray, dst3, threshold, threshold*2); //, cv.THRESH_BINARY);

    if (state.contours !== null) {
        state.contours.delete();
    }
    state.contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(dst3, state.contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
    console.log("# contours: ", state.contours.size());

    let colors = [];
    let areas = [];

    let fill = new cv.Scalar(255, 255, 255);


    let mask = new cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC1); //mask must be single channel or else kaboom!
    for (let i = 0; i < state.contours.size(); ++i) {
        let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
            Math.round(Math.random() * 255));
        colors.push(color);
        cv.drawContours(dst, state.contours, i, color, 1, cv.LINE_8, hierarchy, 100);

        //mask out contour region to compute area...
        cv.bitwise_xor(mask, mask, mask);
        cv.drawContours(mask, state.contours, i, fill, -1); 
        let c = cv.mean(src, mask); 
        state.colors.push( c );

        let a = cv.contourArea( state.contours.get(i) );
        state.areas.push( a );

    }

    mask.delete();
    //let bboxes = [];
    //let centroids = [];

    if (dst2) {

        for (let i = 0; i < state.contours.size(); ++i) {
            let r = cv.boundingRect( state.contours.get(i) );

            let point1 = new cv.Point(r.x, r.y);
            let point2 = new cv.Point(r.x + r.width, r.y + r.height);

            cv.rectangle(dst2, point1, point2, colors[i], 2, cv.LINE_AA, 0);

            state.bboxes.push( [point1.x, point1.y, point2.x, point2.y] );

            let x0 = r.x + r.width/2;
            let y0 = r.y + r.height/2;
            state.centroids.push( new cv.Point(x0, y0) );

       }
    } 

    //console.log('# areas:', state.areas.length);
    //console.log('# bboxes:', state.bboxes.length);

    gray.delete();
    //cannyIm.delete();
    //contours.delete();
    hierarchy.delete();
}

function updateGestalt_Old() { //distIm, areaIm, colorIm) {
    let src = cv.imread(imgElement);

    let colorIm = new cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);
    let areaIm = new cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);
    let distIm = new cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);

    let colorThreshold = document.getElementById("sliderColorThreshold").value;
    colorThreshold = Number.parseFloat(colorThreshold);

    let areaThreshold = document.getElementById("sliderAreaThreshold").value;
    areaThreshold = Number.parseFloat(areaThreshold);

    let proximityThreshold = document.getElementById("sliderProximityThreshold").value;
    proximityThreshold = Number.parseFloat(proximityThreshold);


    let nodeColor = new cv.Scalar(255, 0, 0);
    let edgeColor = new cv.Scalar(0, 0, 255);

    for (let i=0; i< state.areas.length; i++) {
        for (let j=i+1; j< state.areas.length; j++) {
            let dArea = Math.abs( state.areas[i] - state.areas[j]);
            if (dArea < areaThreshold) {
                cv.circle(areaIm, state.centroids[i], 2, nodeColor, 1);
                cv.circle(areaIm, state.centroids[j], 2, nodeColor, 1);
                cv.line(areaIm, state.centroids[i], state.centroids[j], edgeColor, 1);
            }

            let dProximity = bboxDistance(state.bboxes[i], state.bboxes[j]); 
            if (dProximity < proximityThreshold) {
                cv.circle(distIm, state.centroids[i], 2, nodeColor, 1);
                cv.circle(distIm, state.centroids[j], 2, nodeColor, 1);
                cv.line(distIm, state.centroids[i], state.centroids[j], edgeColor, 1);
            }


        /*
           let dColor = colorDistance(state.colors[i], state.colors[j]); 
           if (dColor < colorThreshold) {
           cv.circle(colorIm, state.centroids[i], 2, nodeColor, 1);
           cv.circle(colorIm, state.centroids[j], 2, nodeColor, 1);
           cv.line(colorIm, state.centroids[i], state.centroids[j], edgeColor, 1);
           }
           */

    }
    }

    cv.imshow('canvasSimilarityArea', areaIm);
    cv.imshow('canvasProximity', distIm);

    colorIm.delete();
    areaIm.delete();
    distIm.delete();

}

function updateGestalt_prev() { //distIm, areaIm, colorIm) {

    state.distances = {};

    let k = 7;
    let src = cv.imread(imgElement);

    let colorIm = new cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);
    let areaIm = new cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);
    let distIm = new cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);

    let colorThreshold = document.getElementById("sliderColorThreshold").value;
    colorThreshold = Number.parseFloat(colorThreshold);

    let areaThreshold = document.getElementById("sliderAreaThreshold").value;
    areaThreshold = Number.parseFloat(areaThreshold);

    let proximityThreshold = document.getElementById("sliderProximityThreshold").value;
    proximityThreshold = Number.parseFloat(proximityThreshold);


    let colorWeight = document.getElementById("colorCB").checked ? 1 : 0;

    let areaWeight = document.getElementById("areaCB").checked ? 1 : 0;

    let proximityWeight = document.getElementById("proximityCB").checked ? 1 : 0;;


    let nodeColor = new cv.Scalar(255, 0, 0);
    let edgeColor = new cv.Scalar(0, 255, 255);
    let edgeColor2 = new cv.Scalar(0, 255, 0);
    let edgeColor3 = new cv.Scalar(255, 255, 0);

    let maxIdx = state.areas.length - 1;
    let iterCount = 0;
    for (let i=0; i< state.areas.length; i++) {


        for (let j=0; j<k; j++) {

            let idx = parseInt(Math.random() * maxIdx);

            iterCount++;

            let dArea = Math.abs( state.areas[i] - state.areas[idx]);
            if (dArea < areaThreshold) {
                cv.circle(areaIm, state.centroids[i], 2, nodeColor, 1);
                cv.circle(areaIm, state.centroids[idx], 2, nodeColor, 1);
                cv.line(areaIm, state.centroids[i], state.centroids[idx], edgeColor, 1);
            }

            let dProximity = bboxDistance(state.bboxes[i], state.bboxes[idx]); 
            if (dProximity < proximityThreshold) {
                cv.circle(distIm, state.centroids[i], 2, nodeColor, 1);
                cv.circle(distIm, state.centroids[idx], 2, nodeColor, 1);
                cv.line(distIm, state.centroids[i], state.centroids[idx], edgeColor2, 1);
            }


            let dColor = colorDistance(state.colors[i], state.colors[idx]); 
            //console.log('c', dColor);
            if (dColor < colorThreshold) {
                cv.circle(colorIm, state.centroids[i], 2, nodeColor, 1);
                cv.circle(colorIm, state.centroids[idx], 2, nodeColor, 1);
                cv.line(colorIm, state.centroids[i], state.centroids[idx], edgeColor3, 1);
            }


            let dGestalt = 0; //wArea*dArea + wProximity*dProximity + wColor*dArea


            if (dArea * areaWeight >= areaThreshold) {
                continue;
            }
            else if (dProximity * proximityWeight >= proximityThreshold) {
                continue;
            }
            else if (dColor * colorWeight >= colorThreshold) {
                continue;
            }
            let distanceBA = {other: idx,
                area: dArea,
                proximity: dProximity,
                color: dColor,
                gestalt: dGestalt};
            if (!state.distances[i]) {
                state.distances[i] = [];
            }
            state.distances[i].push( distanceBA );


            let distanceAB = {other: i,
                area: dArea,
                proximity: dProximity,
                color: 0, //dColor,
                gestalt: dGestalt};
            if (!state.distances[idx]) {
                state.distances[idx] = [];
            }
            state.distances[idx].push( distanceAB );

        }
    }


    console.log("updateGestalt() iterCount=", iterCount, ' vs O(N^2)=', Math.pow(state.areas.length, 2));
    let paths = graphGroup(state.distances);
    drawGraphGroup(src, paths);

    cv.imshow('canvasSimilarityArea', areaIm);
    cv.imshow('canvasProximity', distIm);
    cv.imshow('canvasSimilarityColor', colorIm);

    //src.delete();
    colorIm.delete();
    areaIm.delete();
    distIm.delete();


}

function updateGestalt() { 

    state.distances = {};

    let k = 7;
    let src = cv.imread(imgElement);

    let colorIm = new cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);
    let areaIm = new cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);
    let distIm = new cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);
    let gestaltIm = new cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);
    let gestaltGraphIm = new cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);

    let colorThreshold = document.getElementById("sliderColorThreshold").value;
    colorThreshold = Number.parseFloat(colorThreshold);

    let areaThreshold = document.getElementById("sliderAreaThreshold").value;
    areaThreshold = Number.parseFloat(areaThreshold);

    let proximityThreshold = document.getElementById("sliderProximityThreshold").value;
    proximityThreshold = Number.parseFloat(proximityThreshold);


    let colorWeight = document.getElementById("colorCB").checked ? 1 : 0;

    let areaWeight = document.getElementById("areaCB").checked ? 1 : 0;

    let proximityWeight = document.getElementById("proximityCB").checked ? 1 : 0;;

    let cliqueSize = document.getElementById("cliqueSizeCount").value;
    cliqueSize = Number.parseInt(cliqueSize);

    let nodeColor = new cv.Scalar(255, 0, 0);
    let edgeColor = new cv.Scalar(0, 255, 255);
    let edgeColor2 = new cv.Scalar(0, 255, 0);
    let edgeColor3 = new cv.Scalar(255, 255, 0);


    //this could be computed once in getContours()
    state.distances = computeDistances(state);

    let N = state.contours.size();
    let colorGraph = convertDistances2Graph(N, state.distances, {'color': colorThreshold});
    let distGraph = convertDistances2Graph(N, state.distances, {'proximity': proximityThreshold});
    let areaGraph = convertDistances2Graph(N, state.distances, {'area': areaThreshold});
    let gestaltGraph = convertDistances2Graph(N, state.distances, 
        {'color': colorThreshold,
            'proximity': proximityThreshold,
            'area': areaThreshold},
        {'color': colorWeight,
         'proximity': proximityWeight,
         'area': areaWeight});

    /*
    let colorSets = convertGraph2Sets(colorGraph); 
    let distSets = convertGraph2Sets(distGraph); 
    let areaSets = convertGraph2Sets(areaGraph); 
    let gestaltSets = convertGraph2Sets(gestaltGraph);
    */
    let colorSets = convertGraph2CliqueSets(colorGraph, cliqueSize); 
    let distSets = convertGraph2CliqueSets(distGraph, cliqueSize); 
    let areaSets = convertGraph2CliqueSets(areaGraph, cliqueSize); 

    let gestaltSets = convertGraph2CliqueSets(gestaltGraph, cliqueSize);
 
    colorIm = drawContourSets(colorSets, colorIm, state.contours);
    distIm = drawContourSets(distSets, distIm, state.contours);
    areaIm = drawContourSets(areaSets, areaIm, state.contours);
    gestaltIm = drawContourSets(gestaltSets, gestaltIm, state.contours);

    cv.imshow('canvasSimilarityArea', areaIm);
    cv.imshow('canvasProximity', distIm);
    cv.imshow('canvasSimilarityColor', colorIm);
    cv.imshow('canvasCombined', gestaltIm);

    //gestaltGraphIm = drawGestaltGraph(gestaltSets, gestaltGraphIm, state.centroids);
    //gestaltGraphIm = drawGestaltGraph2(gestaltSets, gestaltGraphIm, gestaltGraph, state.centroids);
    gestaltGraphIm = drawGestaltSpan(gestaltSets, gestaltGraphIm, gestaltGraph, state.centroids);
    cv.imshow('canvasGestaltGraph', gestaltGraphIm);

    //src.delete();
    colorIm.delete();
    areaIm.delete();
    distIm.delete();
    gestaltIm.delete();
    gestaltGraphIm.delete();
}


function computeDistances(state) { 
    //Compute randomly sampled pairwise distances
    let distances = [];

    let maxIdx = state.areas.length - 1;

    //randomly sample if the cost is too much to bear
    let k = state.areas.length;
    let useSampling = false;
    if (Math.pow(maxIdx+1, 2) > MAX_ITEMS) {
        useSampling = true; 
        k = Math.floor(MAX_ITEMS / (maxIdx + 1));
        console.log("Setting k=", k);
    }
    let iterCount = 0;
    let visited = {};
    for (let i=0; i<=maxIdx; i++) {

        for (let j=0; j<k; j++) {

            let idx = j;
            if (useSampling) {
                idx = parseInt(Math.random() * maxIdx);
            }             
            iterCount++;

            if (i == idx) {
                continue;
            }
            let [a, b] = (i < idx) ? [i, idx] : [idx, i];
            if (visited[ [a,b] ]) {
                continue;
            }
            visited[ [a,b] ] = true;

            let dArea = Math.abs( state.areas[i] - state.areas[idx]);
            let dProximity = bboxDistance(state.bboxes[i], state.bboxes[idx]); 
            let dColor = colorDistance(state.colors[i], state.colors[idx]); 

            let dGestalt = 0; //compute later


            let distance = {indices: [a, b],
                area: dArea,
                proximity: dProximity,
                color: dColor,
                gestalt: dGestalt};


            distances.push( distance );
        }
    }


    console.log("computeDistances() iterCount=", iterCount, ' vs O(N^2)=', Math.pow(maxIdx+1, 2));

    return distances;
}


function convertDistances2Graph(N, distances, filters, weights) {
    //filter: {key: threshold} required
    //weight: {key: weight} optional
    //let result = [];
    let graph = {}; // {idx: [neighbors]}
    for (let i=0; i<distances.length; i++) {
        let keep = true;
        for (let f in filters) {
            let threshold = filters[f];
            let w = (!weights || weights[f] === undefined) ? 1 : weights[f];
            if (w * distances[i][f] > threshold) {
                keep = false;
                break;
            }
        }

        if (keep) {
            let [a, b] = distances[i].indices; 
            if (!graph[a]) {
                graph[a] = [];
            }
            graph[a].push(b);

            if (!graph[b]) {
                graph[b] = [];
            }
            graph[b].push(a);
        }
    }

    //fill in nodes that have no connections
    for (let i=0; i<N; i++) {
        if (!graph[i]) {
            graph[i] = [];
        }
    }
    return graph;
}

function groupByDistances(distances) {
    //make not work, needs unionFind type data structure + support algos to work!
    let currSet = 0;
    let node2Set = {}; // {nodeIdx: setIdx}
    let set2Set = {}; // {setIdx: [parentSetIdx]} for connecting sets w/o having to re-assign all nodes
    for (let i=0; i<distances.length; i++) {
        let [i, j] = distances[i].indices;

        let setI = node2Set[i];
        let setJ = node2Set[j];

        if (setI == null && setJ == null) {
            currSet++;
            node2Set[i] = currSet;
            node2Set[j] = currSet;

        } else if(setI != null && setJ == null) {
            node2Set[j] = setI;

        } else if (setI == null && setJ != null) {
            node2Set[i] = setJ;
        } else if (setI != null && setJ != null) {
            if (setI == setJ) {
                continue;
            } else {
                if (setI < setJ) {
                    if (!set2Set[setJ]) {
                        set2Set[setJ] = [];
                    }
                    set2Set[setJ].push( setI );
                } else {
                    if (!set2Set[setI]) {
                        set2Set[setI] = [];
                    }
                    set2Set[setI].push( setJ );
                }
            }
        }
    }


    let sets = {}; //{setIdx: [nodeIdx]}
    Object.keys(node2Set).forEach( (idx) => {
        let setIdx = node2Set[idx];
        while (set2Set[setIdx] != undefined) {
            let setIdx = Math.min(set2Set[setIdx]);
        } 
        if (!sets[setIdx]) {
            sets[setIdx] = [];
        }
        sets[setIdx].push( idx );
    });
    return sets;
}

function convertGraph2Sets(graph) {
    //graph: {nodeI: [neighbors]} unweighted graph, edges are filters already
    let visited = {};
    let q = [];
    let sets = [];
    let iterCount = 0;

    let maxIters = 100000;
    for (let node in graph) {
        if (visited[node]) {
            continue;
        }

        let currSet = [];
        q.push( node );
        while (q.length > 0) {

            let nodeI = q.shift();
            iterCount++;

            //console.log(iterCount, node, q.length);
            if (iterCount > maxIters) {
                break;
            }
            if (visited[nodeI]) {
                continue;
            }	
            visited[nodeI] = true;

            currSet.push( nodeI );

            let neighbors = graph[nodeI];
            //console.log('neighbors', neighbors);
            if (!neighbors) {
                continue;
            }

            neighbors.forEach( (nodeJ) => {
                if (!visited[nodeJ]) {
                    q.push( nodeJ );
                }
            });
        }
        sets.push( currSet );

        if (iterCount > maxIters) {
            break;
        }

    }

    console.log("convertGraph2Sets() iterCount=", iterCount, ' vs O(N^2)=', Math.pow(Object.keys(graph).length, 2));
    console.log("convertGraph2Sets() # sets=", sets.length);
    return sets;
}


function convertGraph2CliqueSets(graph, cliqueSize) {
    //graph: {nodeI: [neighbors]} unweighted graph, edges are filters already
    let visited = {};
    let q = [];
    let sets = [];
    let iterCount = 0;

    if (cliqueSize === undefined) {
        cliqueSize = 3;
    }
    let maxIters = 100000;
    for (let node in graph) {
        if (visited[node]) {
            continue;
        }

        let currSet = [];
        q.push( node );
        while (q.length > 0) {

            let nodeI = q.shift();
            iterCount++;

            //console.log(iterCount, node, q.length);
            if (iterCount > maxIters) {
                break;
            }
            if (visited[nodeI]) {
                continue;
            }	
            visited[nodeI] = true;

            currSet.push( nodeI );

            let neighbors = graph[nodeI];
            //console.log('neighbors', neighbors);
            if (!neighbors) {
                continue;
            }

            neighbors.forEach( (nodeJ) => {
                if (!visited[nodeJ] && 
                    findClique(graph, nodeI, nodeJ, cliqueSize).isClique) {
                    q.push( nodeJ );
                }
            });
        }
        sets.push( currSet );

        if (iterCount > maxIters) {
            break;
        }

    }

    console.log("convertGraph2CliqueSets() iterCount=", iterCount, ' vs O(N^2)=', Math.pow(Object.keys(graph).length, 2));
    console.log("convertGraph2CliqueSets() # sets=", sets.length);
    return sets;
}

function findClique(graph, a, b, cliqueSize) {
        //G : graph
        //a,b : node indices, already known to be connected
        //m : number of shared nodes for a clique
        let Na = graph[a];
        let Nb = graph[b];

        if (cliqueSize === undefined) {
                cliqueSize = 3;
            }

        let shared = {};
        shared[a] = true,
        shared[b] = true;

        let isClique = false;
        let iterCount = 0;
        for (let i=0; i<Na.length; i++) {
                for (let j=0; j<Nb.length; j++) {
                        iterCount++;
                        //console.log(Na[i], Nb[j], Na[i] == Nb[j]);
                        if (Na[i] == Nb[j]) {
                            shared[Na[i]] = true;
                            break;
                            }
                    }

                if (Object.keys(shared).length >= cliqueSize) {
                        isClique = true;
                        break;
                    }
            }
        
        //console.log("findGraphCliqueConnected() iterCount=", iterCount);
        //return [isClique, shared];
        return {isClique: isClique, clique: Object.keys(shared)};
}

function drawContourSets(sets, im, contours) {
    for (let i in sets) {
        let color = new cv.Scalar(Math.round(Math.random() * 255), 
                            Math.round(Math.random() * 255),
                            Math.round(Math.random() * 255));

        for (let j in sets[i]) {
            let idx = parseInt(sets[i][j]);
            cv.drawContours(im, contours, idx, color, 1, cv.LINE_8); 
        }
    }
    return im;
}

function drawGestaltGraph(sets, im, centroids) {
    for (let i in sets) {
        let color = new cv.Scalar(Math.round(Math.random() * 255), 
                            Math.round(Math.random() * 255),
                            Math.round(Math.random() * 255));

        for (let j in sets[i]) {
            let idx = parseInt(sets[i][j]);
            cv.circle(im, centroids[idx], 2, color, 1);
            //edges later?
        }
    }
    return im;
}

function drawGestaltGraph2(sets, im, graph, centroids) {
    let palette = [];
    for (let i in sets) {
        let color = new cv.Scalar(Math.round(Math.random() * 255), 
                            Math.round(Math.random() * 255),
                            Math.round(Math.random() * 255));

        //palette.push( color );

        let N = sets[i].length;
        //for (let j in sets[i]) {
        for (let j=0; j<N; j++) {
            let idx = parseInt(sets[i][j]);
            for (let k=j+1; k<N; k++) {
                idx2 = parseInt(sets[i][k]);
                //cv.circle(im, centroids[idx], 2, color, 1);
                //cv.line(im, hullPts[i-1], hullPts[i], edgeColor, 1);
                cv.line(im, centroids[idx],  centroids[idx2], color, 1);
            }
        }

        for (let j=0; j<N; j++) {
            let idx = parseInt(sets[i][j]);
            cv.circle(im, centroids[idx], 3, color, 1);
        }
    }
    return im;
}

function drawGestaltSpan(sets, im, graph, centroids) {
    //find spanning tree for each set
    let palette = [];
    for (let i in sets) {
        let color = new cv.Scalar(Math.round(Math.random() * 255), 
                            Math.round(Math.random() * 255),
                            Math.round(Math.random() * 255));

        //palette.push( color );

        let N = sets[i].length;
        let visited = {};
        let q = [];
        let pairs = [];
        let pairFound = {};
        //BFS find pairs
        for (let j=0; j<N; j++) {
            let idx = sets[i][j];
            if (visited[idx])
                continue;

            q.push( idx );

            while (q.length > 0) {
                let node = q.shift();

                if (visited[node]) 
                    continue;

                visited[node] = true;
                let neighbors = graph[node];

                for (let k=0; k<neighbors.length; k++) {
                    let node2 = neighbors[k];
                    if (visited[node2])
                        continue;

                    let found = sets[i].filter( (x) => { return x == node2; });
                    if (found.length == 0) 
                        continue;
                
                    q.push(node2);
                    if (!pairFound[node] || !pairFound[node2]) {
                        pairs.push( [node, node2] );
                        pairFound[node] = true;
                        pairFound[node2] = true;
                    }
                };
            }
        }
        //draw pairs
        for (let j=0; j<pairs.length; j++) {
                let [idx, idx2] = pairs[j]; 
                cv.line(im, centroids[idx],  centroids[idx2], color, 1);
        }

        //draw nodes
        for (let j=0; j<N; j++) {
            let idx = parseInt(sets[i][j]);
            cv.circle(im, centroids[idx], 3, color, 1);
        }
    }
    return im;
}


function graphGroup(distances) {
    //let keys = Object.keys(distances).map( (x) => { return parseInt(x) }); //otherw keys returns indices as strings!
    let keys = Object.keys(distances); //for array indices/object keys strings & ints are interchangeable
    let visited = {};
    let q = [];
    let paths = [];
    let iterCount = 0;

    let maxIters = 100000;
    console.log('keys', keys);
    for (let i=0; i<keys.length; i++) {
        let idx = keys[i]; 
        if (visited[idx]) {
            continue;
        }

        let currPath = [];
        q.push( idx );
        while (q.length > 0) {

            let node = q.shift();
            iterCount++;

            //console.log(iterCount, node, q.length);
            if (iterCount > maxIters) {
                break;
            }
            if (visited[node]) {
                continue;
            }	

            currPath.push( node );
            visited[node] = true;

            let neighbors = distances[node];
            //console.log('neighbors', neighbors);
            if (!neighbors) {
                continue;
            }

            neighbors.forEach( (n) => {
                if (!visited[n.other]) {
                    q.push( n.other );
                }
            });
        };
        paths.push( currPath );

        if (iterCount > maxIters) {
            break;
        }

    }

    console.log("graphGroup() iterCount=", iterCount, ' vs O(N^2)=', Math.pow(keys.length, 2));
    console.log("graphGroup() # paths=", paths.length);
    return paths;
}

function drawGraphGroup(src, paths) {
    let gestaltIm = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);

    let hulls = new cv.MatVector();
    let hullsJS = [];
    for (let i=0; i<paths.length; i++) {
        //let p = paths[i];
        let pts = []; 
        let ptsRaw = [];
        for (let j=0; j<paths[i].length; j++) {
            let idx = paths[i][j];
            let pt = state.centroids[idx];
            //console.log('pt', pt.x, pt.y);
            pts.push( [pt.x, pt.y] );
            ptsRaw.push( state.centroids[idx] );
        }
        let hullJarvis = convexHullJarvis( ptsRaw );
        if (hullJarvis.length == 0) {
            continue;
        }
        let color = new cv.Scalar(Math.round(Math.random() * 255), 
            Math.round(Math.random() * 255),
            Math.round(Math.random() * 255));
        drawHull(gestaltIm, hullJarvis, color);

        /*
            //opencv convex hull -> no joy
                    let ptsMat = cv.matFromArray(pts.length, 2, cv.CV_32S, pts);
                    let tmp = new cv.Mat();
                    cv.convexHull(ptsMat, tmp, false, true);
                    hulls.push_back(tmp);
                    tmp.delete();
                    */
    }

    /*
        //opencv convex hull doesn't seem to work!
        //color all hulls the same
            let color = new cv.Scalar(Math.round(Math.random() * 255), 
                            Math.round(Math.random() * 255),
                            Math.round(Math.random() * 255));

            console.log("# convex hulls:", hulls.size());
            cv.drawContours(gestaltIm, hulls, -1, color, 1, cv.LINE_8); //draw all but will be same color!
            */ 

    /*
        //...or diff colors for each
            for (let i=0; i<hulls.size(); i++) {
                    let color = new cv.Scalar(Math.round(Math.random() * 255), 
                            Math.round(Math.random() * 255),
                            Math.round(Math.random() * 255));

                //console.log('hull\n', hulls.get(i));
                //console.log('hull size:', hulls.get(i).size());
                //console.log('gestaltIm:', gestaltIm.rows, gestaltIm.cols, gestaltIm.channels());
                    cv.drawContours(gestaltIm, hulls, i, color, 1, cv.LINE_8); //, null, 100);
                }
                */ 
                cv.imshow('canvasCombined', gestaltIm);
                gestaltIm.delete();
                hulls.delete();
            }

function orientation(p, q, r) {
    let val = (q.y - p.y) * (r.x - q.x) -
        (q.x - p.x) * (r.y - q.y);
    if (val == 0) {
        return 0;
    } else {
        return (val > 0) ? 2 : 3; //2 cw, 3 ccw
    }
}

function convexHullJarvis(pts) {
    /*
           based on algorithm here:
            https://iq.opengenus.org/gift-wrap-jarvis-march-algorithm-convex-hull/

*/
    let hullPts = [];


    if (pts.length < 3) {
        console.log("Too few points, no convex hull possible!");
        return [];
    } else if (pts.length == 3) {
        return pts;
    }

    //1. Find left-most point in openPts;
    let minIdx = 0;
    for (let i=0; i<pts.length; i++) {
        if (pts[i].x < pts[minIdx].x)  {
            minX = pts[i].x;
            minIdx = i;
        }
    }

    //2. Gift-wrap to find convex hull
    let p = minIdx;
    let q = null;
    let maxIters = 1000;
    let iterCount = 0;
    do {
        hullPts.push( pts[p] );
        q = (p+1) % pts.length;
        for (let i=0; i<pts.length; i++) {

            iterCount++;
            if (orientation(pts[p], pts[i], pts[q]) == 2) {
                q = i;
            }
        }
        p = q;
        if (iterCount > maxIters) {
            break;
        }
    } while (p != minIdx);

    console.log("convexHullJarvis() # hullPts:", hullPts.length);
    return hullPts;
}

function drawHull(im, hullPts, edgeColor) {

    //console.log('drawHull() im', im);
    //console.log('drawHull() # pts', hullPts.length);
    for (let i=1; i<hullPts.length; i++) {
        //cv.circle(im, hullPts[i-1], 2, nodeColor, 1);
        //cv.circle(im, hullPts[i], 2, nodeColor, 1);

        //console.log(hullPts[i-1], hullPts[i], edgeColor);
        cv.line(im, hullPts[i-1], hullPts[i], edgeColor, 1);

    }
    //console.log('drawHull() last pt?', hullPts[hullPts.length-1]);
    cv.line(im, hullPts[hullPts.length-1], hullPts[0], edgeColor, 1);
    return;
}
/*
   function onOpenCvReady() {
   document.getElementById('status').innerHTML = 'OpenCV.js is ready.';
   }
   */

function bboxDistance(b1, b2) {

    if (checkOverlap(b1, b2)) {
        return 0;
    }
    let [Ax1, Ay1, Ax2, Ay2] = b1;
    let [Bx1, By1, Bx2, By2] = b2;

    let d1 = Math.abs( Ax1 - Bx1 ) + Math.abs( Ay1 - By1);
    let d2 = Math.abs( Ax2 - Bx1 ) + Math.abs( Ay2 - By1);
    let d3 = Math.abs( Ax1 - Bx2 ) + Math.abs( Ay1 - By2);
    let d4 = Math.abs( Ax2 - Bx2 ) + Math.abs( Ay2 - By2);

    return Math.min(d1, d2, d3, d4);
}

function checkOverlap(b1, b2) {
    let [Ax1, Ay1, Ax2, Ay2] = b1;
    let [Bx1, By1, Bx2, By2] = b2;

    if (Ax1 < Bx1 && Bx1 < Ax2) {
        if (Ay1 < By1 && By1 < Ay2) {
            return true;
        } else if (Ay1 < By2 && By2 < Ay2) {
            return true;
        }
    } else if (Ax1 < Bx2 && Bx2 < Ax2) {
        if (Ay1 < By1 && By1 < Ay2) {
            return true;
        } else if (Ay1 < By2 && By2 < Ay2) {
            return true;
        }
    }

    return false;
}

function colorDistance(c1, c2) {
    let d = 0;
    let N = (c1.length == 1) ? 1 : 3;
    for (let i=0; i<N; i++) {
        d += Math.abs(c1[i] - c2[i]);
    }
    return d;
}

function saveState() {
    //save parameters 
    let filename = document.getElementById("imageSrc").src;

    let threshold = document.getElementById("sliderEdgeThreshold").value;
    threshold = Number.parseFloat(threshold);

    let colorThreshold = document.getElementById("sliderColorThreshold").value;
    colorThreshold = Number.parseFloat(colorThreshold);

    let areaThreshold = document.getElementById("sliderAreaThreshold").value;
    areaThreshold = Number.parseFloat(areaThreshold);

    let proximityThreshold = document.getElementById("sliderProximityThreshold").value;
    proximityThreshold = Number.parseFloat(proximityThreshold);


    let colorWeight = document.getElementById("colorCB").checked ? 1 : 0;
    let areaWeight = document.getElementById("areaCB").checked ? 1 : 0;
    let proximityWeight = document.getElementById("proximityCB").checked ? 1 : 0;;


    /*
    let stateData = {colors: state.colors,
            areas: state.areas,  
            centroids: state.centroids,
            bboxes: state.bboxes,
            distances: state.distances,
            contours: null,
            filename: filename,
            edgeThreshold: threshold,
            colorThreshold: colorThreshold,
            areaThreshold: areaThreshold,
            proximityThreshold: proximityThreshold,
            colorWeight: colorWeight,
            areaWeight: areaWeight,
            proximityWeight: proximityWeight
    };
 
    return JSON.stringify(stateData);
    */
    let params = {filename: filename,
            edgeThreshold: threshold,
            colorThreshold: colorThreshold,
            areaThreshold: areaThreshold,
            proximityThreshold: proximityThreshold,
            colorWeight: colorWeight,
            areaWeight: areaWeight,
            proximityWeight: proximityWeight
    };
 
    return JSON.stringify(params);
}

function restoreState() {
    //save parameters 
    let filenameElem = document.getElementById("imageSrc").src;

    let thresholdElem = document.getElementById("sliderEdgeThreshold");
    let colorThresholdElem = document.getElementById("sliderColorThreshold");
    let areaThresholdElem = document.getElementById("sliderAreaThreshold");
    let proximityThresholdElem = document.getElementById("sliderProximityThreshold");

    let colorWeightElem = document.getElementById("colorCB");
    let areaWeightElem = document.getElementById("areaCB");
    let proximityWeightElem = document.getElementById("proximityCB");

    let params = JSON.parse(text);

    filenameElem.src = params.filename;
    thresholdElem.value = params.edgeThreshold;
    colorThresholdElem.value = param.colorThreshold;
    areaThresholdElem.value = param.areaThreshold;
    proximityThresholdElem.value = param.proximityThreshold;
    colorWeightElem.checked = (param.colorWeight == "1") ? true : false;
    areaWeightElem.checked = (param.areaWeight == "1") ? true : false;
    proximityWeightElem.checked = (param.proximityWeight == "1") ? true : false;
}
