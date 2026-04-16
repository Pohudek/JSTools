export class QuadTree {
  constructor(boundary, n, showActiveBoundaries) {
    this.boundary = boundary;
    this.capacity = n || 4;
    this.showActiveBoundaries = showActiveBoundaries;

    this.points = [];
    this.divided = false;
  }

  subdivide() {
    const { x, y, w, h } = this.boundary;
    const nw = new Boundary(x - w / 2, y - h / 2, w / 2, h / 2);
    this.northwest = new QuadTree(nw, this.capacity);
    const ne = new Boundary(x + w / 2, y - h / 2, w / 2, h / 2);
    this.northeast = new QuadTree(ne, this.capacity);
    const sw = new Boundary(x - w / 2, y + h / 2, w / 2, h / 2);
    this.southwest = new QuadTree(sw, this.capacity);
    const se = new Boundary(x + w / 2, y + h / 2, w / 2, h / 2);
    this.southeast = new QuadTree(se, this.capacity);

    this.divided = true;
  }

  insert(point) {
    if (!this.boundary.contains(point)) return false;

    if (this.points.length < this.capacity && !this.divided) {
      this.points.push(point);
      return true;
    }

    if (!this.divided) {
      this.subdivide();

      this.points.forEach((point) => {
        this.northwest.insert(point) || this.northeast.insert(point) || this.southwest.insert(point) || this.southeast.insert(point);
      });

      this.points = [];
    }

    if (this.northwest.insert(point)) return true;
    else if (this.northeast.insert(point)) return true;
    else if (this.southwest.insert(point)) return true;
    else if (this.southeast.insert(point)) return true;
    else console.warn("failed to insert point: " + point);
  }

  query(range, found) {
    if (!found) found = [];

    if (!this.boundary.intersects(range)) return found;

    if (this.divided) {
      this.northwest.query(range, found);
      this.northeast.query(range, found);
      this.southwest.query(range, found);
      this.southeast.query(range, found);
    } else {
      for (const p of this.points) {
        if (range.contains(p)) {
          found.push(p);
        }
      }
    }

    if (this.divided) return found;

    if (this.showActiveBoundaries == true) {
      const { x, y, w, h } = this.boundary;
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.strokeRect(x - w, y - h, w * 2, h * 2);
    }

    return found;
  }

  draw() {
    ctx.rect(this.boundary.x - this.boundary.w, this.boundary.y - this.boundary.h, this.boundary.w * 2, this.boundary.h * 2);

    if (this.divided) {
      this.northwest.draw();
      this.northeast.draw();
      this.southwest.draw();
      this.southeast.draw();
    }
  }
}

export class Boundary {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  contains(point) {
    return !(point.x < this.x - this.w || point.x > this.x + this.w || point.y < this.y - this.h || point.y > this.y + this.h);
  }

  intersects(range) {
    return !(
      range.x + range.w < this.x - this.w ||
      range.x - range.w > this.x + this.w ||
      range.y + range.h < this.y - this.h ||
      range.y - range.h > this.y + this.h
    );
  }
}
