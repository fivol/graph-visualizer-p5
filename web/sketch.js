/// Вершины графа можно двигать мышкой!

/// Тут перечислены параметры, которые можно менять, для коррекции поведения
// алгоритма отрисовки графа. (Сначала идет описание, затем параметры)
// По умолчанию все выставлено и так неплохо...
// Замечание: граф - сложная система, и понять, как определенная конфикурация
// параметров будет работать довольно сложно
// Совет: выставить основные параметры на 0 (тогда граф замрет)
// замем менять каждые по отдельности для достижения наилучшего результат
// затем совмещать полученные значения


// Ключевые параметры, задающие движение узлов графа
// Все представлены в формате
// let param = [pow, lowerBound, upperBound, minRealValue, coef]
// Модуль вектора приводится из рамок 
// (minRealValue, max(height, width)) в (lowerBound, upperBound).
// То, что выходит за границы отсекается
// Полученное значение умножается на coef для относительной регулировки
// pow - степень в которую возводится нормализованный модуль вектора


const repulsionForce = [-2.4, 1, 10, 10, 7]
const attractionForce = [2, 0, 4, 2, 10]
const borderRepulsionForce = [-1, 0.5, 10, 20, 0.1]
const centralAttractionForce = [1, 1, 2, 2, 0.01*0]


// Показатель, действующий на итоговый сдвиг каждого узла
// После пересчета значения сдвига вершины, это значение умножается на moveStrength

const moveStrength = 20


// Если true, то вержина не сможет покинуть квадрат отображения
const needBorderBox = false


// Если true, то полученная сила, приложенная к вершине будет влиять
// на скорость узла, а не местоположение, таким образом появляется инерция

const applyForceModeVelocity = false


// frameRateValue - максимальное fps
// Если iterationsToShow - null, то отображается анимация
// иначе n итераций происходит без анимации и выводится только результат

const frameRateValue = 100
let iterationsToShow = 50
iterationsToShow = null


// Нельзя указывать ребер больше чем может быть. Иначе будет бесконечный цикл
// Ребра не повторяются и нет петель. На графе ровно указанное количество 
// уникальных ребер

const randomNodesCount = 10;
const randomEdgesCount = 10;

// Размеры холста

width_ = 800
height_ = 800


/// Тут уже начинается код. Если не шаришь, лучше не лезь, иначе все сломаешь

const maxSize = Math.max(width_, height_)

class Node{
  constructor(id){
    this.id = id;
    let x = 1 + Math.random() * (width - 2);
    let y = 1 + Math.random() * (height - 2);
    this.pos = createVector(x, y)
    this.velocity = createVector(0, 0)
    this.lockedPosition = false
  }
  
  draw(){
    stroke('black')
    fill('blue')
    circle(this.pos.x, this.pos.y, 10)
  }
  
  getDistanceWith(x, y){
    return createVector(x - this.pos.x, y - this.pos.y).mag()
  }
  
  shiftBy(x, y){
    this.pos.add(createVector(x, y))
  }
  
  moveTo(x, y){
    this.pos = createVector(x, y)
  }
  
  lockMovement(){
    this.lockedPosition = true
  }
  
  unlockMovement(){
    this.lockedPosition = false
  }
  
  toForceVector(distVector, parameters, direction=1){
    let [pow, lowerBorder, upperBorder, minValue, coef] = parameters;
    
    let dist = distVector.mag();
    distVector.div(dist)
    
    dist = map(dist, minValue, maxSize, lowerBorder, upperBorder, true)
    
    let forceFactor = Math.pow(dist, pow)
    return distVector.mult(forceFactor * coef * direction)
  }
  
  calculateForceWith(other, connected){
    let dir = other.pos.copy().sub(this.pos)
    
    let move = this.toForceVector(dir.copy(), repulsionForce, -1)
    if(connected)
      return this.toForceVector(dir, attractionForce).add(move)
    
    return move
  }
  
  calculateForceWithBorders(){
    let top = createVector(0, max(1, this.pos.y));
    let left = createVector(max(1, this.pos.x), 0);
    let bottom = createVector(0, min(-1, this.pos.y - height_));
    let right = createVector(min(-1, this.pos.x - width_), 0);
    
    let center = createVector(width_ / 2 - this.pos.x, height_ / 2 - this.pos.y);
    
    let sum = this.toForceVector(center, centralAttractionForce)
    sum.add(this.toForceVector(top, borderRepulsionForce));
    sum.add(this.toForceVector(left, borderRepulsionForce));
    sum.add(this.toForceVector(bottom, borderRepulsionForce));
    sum.add(this.toForceVector(right, borderRepulsionForce));
    return sum;
  }
  
  normalizePosition(){
    if(!needBorderBox)
      return
    const normalizeCoordinate = (value, maxValue) => {
      return max(min(value, maxValue), 0)
    }
    
    this.pos = createVector(
      normalizeCoordinate(this.pos.x, width), 
      normalizeCoordinate(this.pos.y, height)
    );
  }
  
  applyForce(forceVector){
    if(this.lockedPosition)
      return
      
    forceVector.mult(moveStrength)
    
    if(applyForceModeVelocity){
      
      this.velocity.add(forceVector)
      this.pos.add(this.velocity)
      
    }else{
      
      this.pos.add(forceVector)
      
    }    
    
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
    line(this.n1.pos.x, this.n1.pos.y, this.n2.pos.x, this.n2.pos.y)
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
  
  getNearestNode(x, y){
    let minDist = 9999999;
    let bestNode = this.nodes[0]
    for(let node of this.nodes){
      let dist = node.getDistanceWith(x, y)
      if(dist < minDist){
        minDist = dist;
        bestNode = node;
      }
    }
    return bestNode
  }
  
  calculateForces(){
    let forces = {};
    for(let node1 of this.nodes){
      let id1 = node1.id;
      let nodeBorderForce = node1.calculateForceWithBorders();
      
      forces[id1] = createVector(0, 0)
      
      for(let node2 of this.nodes){
        let id2 = node2.id;
        if(id1 === id2)
          continue;
          
        let connected = false;
        
        if(this.edgesDict[id1].includes(id2))
          connected = true;
        
        forces[id1].add(node1.calculateForceWith(node2, connected));
      }
      
      forces[id1].div(this.nodes.length).add(nodeBorderForce)
    }
    return forces;
  }
  
  applyForces(){
    let forces = this.calculateForces();
    for(let node of this.nodes){
      node.applyForce(forces[node.id])
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
    let n1 = (floor(random(nodesCount)))
    let n2 = (floor(random(nodesCount)))
    
    if(n1 !== n2 && !edgesDict[n1].includes(n2)){
      i ++
      edgesDict[n1].push(n2)
      edgesDict[n2].push(n2)
      edges.push(new Edge(nodes[n1], nodes[n2]))
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
    console.log('Current FrameRate:', frameRate(), '  Iterations:', iterationNum)
}

let selectedNode = null

function mousePressed() {
  let nearestNode = graph.getNearestNode(mouseX, mouseY)
  if(nearestNode.getDistanceWith(mouseX, mouseY) < 20) {
    selectedNode = nearestNode
    selectedNode.lockMovement()
  }
}

function mouseDragged() {
  if (selectedNode) {
    selectedNode.moveTo(mouseX, mouseY)
  }
}

function mouseReleased() {
  if(selectedNode){
    selectedNode.unlockMovement()
    selectedNode = null
  }
}


