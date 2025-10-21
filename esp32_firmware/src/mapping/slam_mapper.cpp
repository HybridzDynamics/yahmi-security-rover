#include "slam_mapper.h"
#include <ArduinoJson.h>

SLAMMapper::SLAMMapper() {
    map = nullptr;
    mapInitialized = false;
    carPosition = {0.0, 0.0, 0.0};
    carAngle = 0.0;
    occupancyThreshold = 0.7;
    freeThreshold = 0.3;
    maxIterations = 100;
    mapFileName = "/map_data.xml";
    
    // Default configuration
    config.cellSize = 0.1;      // 10cm cells
    config.mapWidth = 200;      // 20m x 20m map
    config.mapHeight = 200;
    config.originX = 10.0;       // Center origin
    config.originY = 10.0;
    config.maxRange = 4.0;       // 4m max range
    config.minRange = 0.05;      // 5cm min range
}

SLAMMapper::~SLAMMapper() {
    if (map != nullptr) {
        for (int i = 0; i < config.mapHeight; i++) {
            delete[] map[i];
        }
        delete[] map;
    }
}

bool SLAMMapper::initialize(MapConfig config) {
    this->config = config;
    
    // Allocate map memory
    map = new MapCell*[config.mapHeight];
    for (int i = 0; i < config.mapHeight; i++) {
        map[i] = new MapCell[config.mapWidth];
        for (int j = 0; j < config.mapWidth; j++) {
            map[i][j] = {UNKNOWN, 0.0, 0, false};
        }
    }
    
    mapInitialized = true;
    Serial.println("SLAM Mapper initialized");
    return true;
}

bool SLAMMapper::loadMap(String fileName) {
    if (!mapInitialized) {
        Serial.println("Map not initialized");
        return false;
    }
    
    mapFileName = fileName;
    
    if (SPIFFS.exists(fileName)) {
        File file = SPIFFS.open(fileName, "r");
        if (file) {
            String xmlData = file.readString();
            file.close();
            
            // Parse XML data
            return parseMapXML(xmlData);
        }
    }
    
    Serial.println("Map file not found, creating new map");
    return true;
}

bool SLAMMapper::saveMap(String fileName) {
    if (!mapInitialized) {
        Serial.println("Map not initialized");
        return false;
    }
    
    mapFileName = fileName;
    return saveMapToXML();
}

bool SLAMMapper::saveMapToXML() {
    if (!SPIFFS.begin()) {
        Serial.println("SPIFFS initialization failed");
        return false;
    }
    
    File file = SPIFFS.open(mapFileName, "w");
    if (!file) {
        Serial.println("Failed to create map file");
        return false;
    }
    
    String xmlData = generateMapXML();
    file.print(xmlData);
    file.close();
    
    Serial.println("Map saved to " + mapFileName);
    return true;
}

String SLAMMapper::generateMapXML() {
    String xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
    xml += "<map>\n";
    xml += "  <config>\n";
    xml += "    <cellSize>" + String(config.cellSize) + "</cellSize>\n";
    xml += "    <width>" + String(config.mapWidth) + "</width>\n";
    xml += "    <height>" + String(config.mapHeight) + "</height>\n";
    xml += "    <originX>" + String(config.originX) + "</originX>\n";
    xml += "    <originY>" + String(config.originY) + "</originY>\n";
    xml += "    <maxRange>" + String(config.maxRange) + "</maxRange>\n";
    xml += "    <minRange>" + String(config.minRange) + "</minRange>\n";
    xml += "  </config>\n";
    
    xml += "  <carPosition>\n";
    xml += "    <x>" + String(carPosition.x) + "</x>\n";
    xml += "    <y>" + String(carPosition.y) + "</y>\n";
    xml += "    <angle>" + String(carAngle) + "</angle>\n";
    xml += "  </carPosition>\n";
    
    xml += "  <cells>\n";
    for (int y = 0; y < config.mapHeight; y++) {
        for (int x = 0; x < config.mapWidth; x++) {
            MapCell cell = map[y][x];
            if (cell.type != UNKNOWN || cell.visited) {
                xml += "    <cell x=\"" + String(x) + "\" y=\"" + String(y) + "\"";
                xml += " type=\"" + String(cell.type) + "\"";
                xml += " confidence=\"" + String(cell.confidence) + "\"";
                xml += " visited=\"" + String(cell.visited ? "true" : "false") + "\"";
                xml += " timestamp=\"" + String(cell.timestamp) + "\"/>\n";
            }
        }
    }
    xml += "  </cells>\n";
    
    xml += generateWaypointXML();
    xml += "</map>\n";
    
    return xml;
}

String SLAMMapper::generateWaypointXML() {
    String xml = "  <waypoints>\n";
    for (const auto& waypoint : waypoints) {
        xml += "    <waypoint id=\"" + String(waypoint.id) + "\"";
        xml += " x=\"" + String(waypoint.x) + "\"";
        xml += " y=\"" + String(waypoint.y) + "\"";
        xml += " name=\"" + waypoint.name + "\"";
        xml += " visited=\"" + String(waypoint.visited ? "true" : "false") + "\"";
        xml += " timestamp=\"" + String(waypoint.timestamp) + "\"/>\n";
    }
    xml += "  </waypoints>\n";
    return xml;
}

void SLAMMapper::updatePosition(float x, float y, float angle) {
    carPosition.x = x;
    carPosition.y = y;
    carAngle = angle;
    
    // Update car position in map
    Point mapPos = worldToMap(x, y);
    if (mapPos.x >= 0 && mapPos.x < config.mapWidth && 
        mapPos.y >= 0 && mapPos.y < config.mapHeight) {
        updateMapCell(mapPos.x, mapPos.y, CAR_POSITION, 1.0);
    }
}

void SLAMMapper::updateSensors(float ultrasonic, float irLeft, float irCenter, float irRight) {
    lastUltrasonicDistance = ultrasonic;
    lastIRLeft = irLeft;
    lastIRCenter = irCenter;
    lastIRRight = irRight;
}

void SLAMMapper::processSensorData() {
    if (!mapInitialized) return;
    
    uint32_t currentTime = millis();
    
    // Process ultrasonic sensor data
    if (lastUltrasonicDistance > config.minRange && lastUltrasonicDistance < config.maxRange) {
        updateOccupancyGrid(lastUltrasonicDistance, carAngle);
    }
    
    // Process IR sensor data
    if (lastIRLeft > 0 && lastIRLeft < config.maxRange) {
        updateOccupancyGrid(lastIRLeft, carAngle - 30.0 * PI / 180.0);
    }
    if (lastIRCenter > 0 && lastIRCenter < config.maxRange) {
        updateOccupancyGrid(lastIRCenter, carAngle);
    }
    if (lastIRRight > 0 && lastIRRight < config.maxRange) {
        updateOccupancyGrid(lastIRRight, carAngle + 30.0 * PI / 180.0);
    }
    
    // Mark current position as visited
    Point mapPos = worldToMap(carPosition.x, carPosition.y);
    if (mapPos.x >= 0 && mapPos.x < config.mapWidth && 
        mapPos.y >= 0 && mapPos.y < config.mapHeight) {
        map[mapPos.y][mapPos.x].visited = true;
        map[mapPos.y][mapPos.x].timestamp = currentTime;
    }
}

void SLAMMapper::updateOccupancyGrid(float distance, float angle) {
    // Convert to world coordinates
    float worldX = carPosition.x + distance * cos(carAngle + angle);
    float worldY = carPosition.y + distance * sin(carAngle + angle);
    
    Point mapPos = worldToMap(worldX, worldY);
    if (mapPos.x >= 0 && mapPos.x < config.mapWidth && 
        mapPos.y >= 0 && mapPos.y < config.mapHeight) {
        
        // Update obstacle
        updateObstacle(distance, angle);
        
        // Update free space along the ray
        updateFreeSpace(distance, angle);
    }
}

void SLAMMapper::updateObstacle(float distance, float angle) {
    float worldX = carPosition.x + distance * cos(carAngle + angle);
    float worldY = carPosition.y + distance * sin(carAngle + angle);
    
    Point mapPos = worldToMap(worldX, worldY);
    if (mapPos.x >= 0 && mapPos.x < config.mapWidth && 
        mapPos.y >= 0 && mapPos.y < config.mapHeight) {
        updateMapCell(mapPos.x, mapPos.y, OBSTACLE, 0.8);
    }
}

void SLAMMapper::updateFreeSpace(float distance, float angle) {
    // Update cells along the ray from car to obstacle
    float stepSize = config.cellSize / 2.0;
    int steps = (int)(distance / stepSize);
    
    for (int i = 1; i < steps; i++) {
        float rayDistance = i * stepSize;
        float worldX = carPosition.x + rayDistance * cos(carAngle + angle);
        float worldY = carPosition.y + rayDistance * sin(carAngle + angle);
        
        Point mapPos = worldToMap(worldX, worldY);
        if (mapPos.x >= 0 && mapPos.x < config.mapWidth && 
            mapPos.y >= 0 && mapPos.y < config.mapHeight) {
            updateMapCell(mapPos.x, mapPos.y, FREE, 0.6);
        }
    }
}

void SLAMMapper::updateMapCell(int x, int y, MapCellType type, float confidence) {
    if (x < 0 || x >= config.mapWidth || y < 0 || y >= config.mapHeight) return;
    
    MapCell& cell = map[y][x];
    uint32_t currentTime = millis();
    
    // Update cell based on type
    if (type == OBSTACLE) {
        if (cell.type == FREE) {
            cell.confidence = (cell.confidence + confidence) / 2.0;
        } else {
            cell.confidence = max(cell.confidence, confidence);
        }
        if (cell.confidence > occupancyThreshold) {
            cell.type = OBSTACLE;
        }
    } else if (type == FREE) {
        if (cell.type == OBSTACLE) {
            cell.confidence = min(cell.confidence, 1.0 - confidence);
        } else {
            cell.confidence = max(cell.confidence, confidence);
        }
        if (cell.confidence > freeThreshold) {
            cell.type = FREE;
        }
    } else {
        cell.type = type;
        cell.confidence = confidence;
    }
    
    cell.timestamp = currentTime;
}

Point SLAMMapper::worldToMap(float worldX, float worldY) {
    Point mapPos;
    mapPos.x = (int)((worldX + config.originX) / config.cellSize);
    mapPos.y = (int)((worldY + config.originY) / config.cellSize);
    return mapPos;
}

Point SLAMMapper::mapToWorld(int mapX, int mapY) {
    Point worldPos;
    worldPos.x = mapX * config.cellSize - config.originX;
    worldPos.y = mapY * config.cellSize - config.originY;
    return worldPos;
}

bool SLAMMapper::addWaypoint(float x, float y, String name) {
    if (name.length() == 0) {
        name = "Waypoint " + String(waypoints.size() + 1);
    }
    
    Waypoint waypoint;
    waypoint.id = millis(); // Simple ID generation
    waypoint.x = x;
    waypoint.y = y;
    waypoint.name = name;
    waypoint.timestamp = millis();
    waypoint.visited = false;
    
    waypoints.push_back(waypoint);
    
    // Add waypoint to map
    Point mapPos = worldToMap(x, y);
    if (mapPos.x >= 0 && mapPos.x < config.mapWidth && 
        mapPos.y >= 0 && mapPos.y < config.mapHeight) {
        updateMapCell(mapPos.x, mapPos.y, WAYPOINT, 1.0);
    }
    
    Serial.println("Waypoint added: " + name + " at (" + String(x) + ", " + String(y) + ")");
    return true;
}

bool SLAMMapper::removeWaypoint(uint32_t id) {
    for (auto it = waypoints.begin(); it != waypoints.end(); ++it) {
        if (it->id == id) {
            waypoints.erase(it);
            Serial.println("Waypoint removed: " + String(id));
            return true;
        }
    }
    return false;
}

std::vector<Waypoint> SLAMMapper::getWaypoints() {
    return waypoints;
}

String SLAMMapper::getMapDataJSON() {
    DynamicJsonDocument doc(8192);
    
    doc["config"]["cellSize"] = config.cellSize;
    doc["config"]["width"] = config.mapWidth;
    doc["config"]["height"] = config.mapHeight;
    doc["config"]["originX"] = config.originX;
    doc["config"]["originY"] = config.originY;
    
    doc["carPosition"]["x"] = carPosition.x;
    doc["carPosition"]["y"] = carPosition.y;
    doc["carPosition"]["angle"] = carAngle;
    
    JsonArray cells = doc["cells"].to<JsonArray>();
    for (int y = 0; y < config.mapHeight; y++) {
        for (int x = 0; x < config.mapWidth; x++) {
            MapCell cell = map[y][x];
            if (cell.type != UNKNOWN || cell.visited) {
                JsonObject cellObj = cells.createNestedObject();
                cellObj["x"] = x;
                cellObj["y"] = y;
                cellObj["type"] = cell.type;
                cellObj["confidence"] = cell.confidence;
                cellObj["visited"] = cell.visited;
                cellObj["timestamp"] = cell.timestamp;
            }
        }
    }
    
    String jsonString;
    serializeJson(doc, jsonString);
    return jsonString;
}

String SLAMMapper::getWaypointsJSON() {
    DynamicJsonDocument doc(2048);
    JsonArray waypointsArray = doc.to<JsonArray>();
    
    for (const auto& waypoint : waypoints) {
        JsonObject wp = waypointsArray.createNestedObject();
        wp["id"] = waypoint.id;
        wp["x"] = waypoint.x;
        wp["y"] = waypoint.y;
        wp["name"] = waypoint.name;
        wp["visited"] = waypoint.visited;
        wp["timestamp"] = waypoint.timestamp;
    }
    
    String jsonString;
    serializeJson(doc, jsonString);
    return jsonString;
}

String SLAMMapper::getCarPositionJSON() {
    DynamicJsonDocument doc(256);
    doc["x"] = carPosition.x;
    doc["y"] = carPosition.y;
    doc["angle"] = carAngle;
    doc["timestamp"] = millis();
    
    String jsonString;
    serializeJson(doc, jsonString);
    return jsonString;
}

void SLAMMapper::clearMap() {
    if (!mapInitialized) return;
    
    for (int y = 0; y < config.mapHeight; y++) {
        for (int x = 0; x < config.mapWidth; x++) {
            map[y][x] = {UNKNOWN, 0.0, 0, false};
        }
    }
    
    waypoints.clear();
    Serial.println("Map cleared");
}

int SLAMMapper::getVisitedCells() {
    int count = 0;
    for (int y = 0; y < config.mapHeight; y++) {
        for (int x = 0; x < config.mapWidth; x++) {
            if (map[y][x].visited) count++;
        }
    }
    return count;
}

int SLAMMapper::getObstacleCells() {
    int count = 0;
    for (int y = 0; y < config.mapHeight; y++) {
        for (int x = 0; x < config.mapWidth; x++) {
            if (map[y][x].type == OBSTACLE) count++;
        }
    }
    return count;
}

int SLAMMapper::getFreeCells() {
    int count = 0;
    for (int y = 0; y < config.mapHeight; y++) {
        for (int x = 0; x < config.mapWidth; x++) {
            if (map[y][x].type == FREE) count++;
        }
    }
    return count;
}

float SLAMMapper::getMapCoverage() {
    int totalCells = config.mapWidth * config.mapHeight;
    int visitedCells = getVisitedCells();
    return (float)visitedCells / totalCells * 100.0;
}

void SLAMMapper::printStatistics() {
    Serial.println("=== Map Statistics ===");
    Serial.println("Map Size: " + String(config.mapWidth) + "x" + String(config.mapHeight));
    Serial.println("Cell Size: " + String(config.cellSize) + "m");
    Serial.println("Visited Cells: " + String(getVisitedCells()));
    Serial.println("Obstacle Cells: " + String(getObstacleCells()));
    Serial.println("Free Cells: " + String(getFreeCells()));
    Serial.println("Map Coverage: " + String(getMapCoverage()) + "%");
    Serial.println("Waypoints: " + String(waypoints.size()));
    Serial.println("Car Position: (" + String(carPosition.x) + ", " + String(carPosition.y) + ")");
    Serial.println("Car Angle: " + String(carAngle * 180.0 / PI) + "°");
}
