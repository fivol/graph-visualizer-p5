// parameters = [pow, lowerBound, upperBond, minRealValue, coef]

let repulsionForce = [-2.4, 1, 10, 10, 7]
let attractionForce = [2, 0, 4, 0, 10]
let borderRepulsionForce = [-1, 0.5, 10, 20, 1]
let centralAttractionForce = [1, 1, 2, 0, 0.01*0]


let frameRateValue = 100
let iterationsToShow = 50
iterationsToShow = null

let moveStrength = 20

let randomNodesCount = 10;
let randomEdgesCount = 8;

width_ = 800
height_ = 800

class Node{
  constructor(id){
    this.id = id;
    this.x = 1 + Math.random() * (width - 2);
    this.y = 1 + Math.random() * (height - 2);
    this.xVelocity = 0
    this.yVelocity = 0
    this.blocked = false
  }
  
  draw(){
    stroke('black')
    fill('blue')
    circle(this.x, this.y, 10)
  }
  
  
  toForceVector(distVector, parameters, direction){
    let dist = distVector.mag();
    
    let [pow, lowerBorder, upperBorder, minValue, coef] = parameters;
    
    dist = min(max(minValue, dist), width)
    dist = map(dist, minValue, width, lowerBorder, upperBorder)
    
    let forceFactor = Math.pow(dist, pow)
    return distVector.normalize().mult(forceFactor * coef * direction)
  }
  
  calculateForceWith(other, connected){
    let x = other.x - this.x;
    let y = other.y - this.y;
    
    let dir = createVector(x, y)
    let move = this.toForceVector(dir.copy(), repulsionForce, -1)
    if(connected)
      return this.toForceVector(dir, attractionForce, 1).add(move)
    
    return move
  }
  
  calculateForceWithBorders(){
    let top = createVector(0, this.y);
    let left = createVector(this.x, 0);
    let bottom = createVector(0, this.y - height);
    let right = createVector(this.x - width, 0);
    
    let center = createVector(width / 2 - this.x, height / 2 - this.y);
    
    let sum = this.toForceVector(center, centralAttractionForce, 1)
    sum.add(this.toForceVector(top, borderRepulsionForce, 1));
    sum.add(this.toForceVector(left, borderRepulsionForce, 1));
    sum.add(this.toForceVector(bottom, borderRepulsionForce, 1));
    sum.add(this.toForceVector(right, borderRepulsionForce, 1));
    return sum;
  }
  
  normalizePosition(){
    const normalizeCoordinate = (value, maxValue) => {
      return max(min(value, maxValue), 0)
    }
    
    // this.x = normalizeCoordinate(this.x, width);
    // this.y = normalizeCoordinate(this.y, height);
  }
  
  applyForce(forceVector){
    // if(this.blocked)
    //   returnconso
    this.xVelocity += forceVector.x * moveStrength;
    this.yVelocity += forceVector.y * moveStrength;
    
    // if(this.accumulateX  == 0 && this.accumulateY == 0)
    //   this.blocked = true
    
    // this.x += this.xVelocity
    // this.y += this.yVelocity
    this.x += forceVector.x * moveStrength
    this.y += forceVector.y * moveStrength
    
    this.normalizePosition()
  }
}

class Edge{
  constructor(n1, n2){
    this.n1 = n1;
    this.n2 = n2;
  }
  draw(){
    stroke('grey')
    line(this.n1.x, this.n1.y, this.n2.x, this.n2.y)
  }
}


class Graph{
  constructor(nodes, edges) {
    this.nodes = nodes;
    this.edges = edges;
    let edgesDict = {};
    for(let node of this.nodes)
      edgesDict[node.id] = []
    
    for(let edge of this.edges){
      let id1 = edge.n1.id;
      let id2 = edge.n2.id;
      edgesDict[id1].push(id2);
      edgesDict[id2].push(id1);
    }
    this.edgesDict = edgesDict;
  }
  
  draw() {
    for(let e of this.edges)
      e.draw()
    
    for(let n of this.nodes)
      n.draw()
  }
  
  calculateForces(){
    let forces = {};
    for(let node1 of this.nodes){
      let id1 = node1.id;
      forces[id1] = node1.calculateForceWithBorders();
      
      for(let node2 of this.nodes){
        let id2 = node2.id;
        if(id1 === id2)
          continue;
          
        let connected = false;
        
        if(this.edgesDict[id1].includes(id2))
          connected = true;
        
        forces[id1].add(node1.calculateForceWith(node2, connected));
      }
    }
    return forces;
  }
  
  applyForces(){
    let forces = this.calculateForces();
    for(let node of this.nodes){
      node.applyForce(forces[node.id].div(this.nodes.length))
    }
  }
}


let graph = null;
let iterationNum = 0

function setup() {
  createCanvas(width_, height_);
  frameRate(frameRateValue);
  let nodesCount = randomNodesCount;
  let edgesCount = randomEdgesCount;
  
  let nodes = [];
  let edges = [];
  let edgesDict = {}
  for(let i = 0; i < nodesCount; i ++ ){
    edgesDict[i] = []
    nodes.push(new Node(i))
  }
  
  for(let i = 0; i < edgesCount; ){
    let node1ID = (floor(random(nodesCount)))
    let node2ID = (floor(random(nodesCount)))
    
    if(node1ID !== node2ID && !edgesDict[node1ID].includes(node2ID)){
      i ++
      edgesDict[node1ID].push(node2ID)
      edgesDict[node2ID].push(node1ID)
      edges.push(new Edge(nodes[node1ID], nodes[node2ID]))
    }
  }
  
  graph = new Graph(nodes, edges);
}


function draw() {
  if(!iterationsToShow || iterationNum === iterationsToShow){
    background(220, 220, 255);
    graph.draw()
    if(iterationNum === iterationsToShow)
      noLoop()
  }
  graph.applyForces()
  iterationNum += 1
  if(iterationNum % 100 === 0)
    console.log(frameRate())
}

