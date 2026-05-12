import math

class Vector2:
    def __init__(self, x: float = 0.0, y: float = 0.0):
        self.x = x
        self.y = y

    @staticmethod
    def zero():
        return Vector2(0, 0)

    def length(self) -> float:
        return math.sqrt(self.x * self.x + self.y * self.y)

    def length_squared(self) -> float:
        return self.x * self.x + self.y * self.y

    def normalize(self):
        length = self.length()
        if length > 0:
            self.x /= length
            self.y /= length
        return self

    def normalized(self):
        length = self.length()
        if length > 0:
            return Vector2(self.x / length, self.y / length)
        return Vector2.zero()

    def multiply_by(self, scalar: float):
        self.x *= scalar
        self.y *= scalar
        return self

    def multiply(self, scalar: float):
        return Vector2(self.x * scalar, self.y * scalar)

    def add_to(self, other: 'Vector2'):
        self.x += other.x
        self.y += other.y
        return self

    def add(self, other: 'Vector2'):
        return Vector2(self.x + other.x, self.y + other.y)

    def subtract(self, other: 'Vector2'):
        return Vector2(self.x - other.x, self.y - other.y)

    def dot(self, other: 'Vector2') -> float:
        return self.x * other.x + self.y * other.y

    def cross(self, other: 'Vector2') -> float:
        return self.x * other.y - self.y * other.x

    def distance_to(self, other: 'Vector2') -> float:
        dx = self.x - other.x
        dy = self.y - other.y
        return math.sqrt(dx * dx + dy * dy)

    def angle_to(self, other: 'Vector2') -> float:
        return math.atan2(other.y - self.y, other.x - self.x)

    def rotate(self, angle: float):
        cos = math.cos(angle)
        sin = math.sin(angle)
        new_x = self.x * cos - self.y * sin
        new_y = self.x * sin + self.y * cos
        self.x = new_x
        self.y = new_y
        return self

    def copy(self):
        return Vector2(self.x, self.y)

    def __str__(self):
        return f"Vector2({self.x}, {self.y})"

    def __repr__(self):
        return self.__str__()

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Vector2):
            return False
        return abs(self.x - other.x) < 1e-6 and abs(self.y - other.y) < 1e-6

    def __add__(self, other: 'Vector2'):
        return self.add(other)

    def __sub__(self, other: 'Vector2'):
        return self.subtract(other)

    def __mul__(self, scalar: float):
        return self.multiply(scalar)

    def __truediv__(self, scalar: float):
        if scalar == 0:
            raise ValueError("Cannot divide by zero")
        return self.multiply(1.0 / scalar)