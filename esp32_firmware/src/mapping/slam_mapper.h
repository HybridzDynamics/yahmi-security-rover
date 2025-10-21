#ifndef SLAM_MAPPER_H
#define SLAM_MAPPER_H

#include <Arduino.h>
#include <vector>
#include <SD.h>
#include <SPIFFS.h>

// Map cell types
enum MapCellType {
    UNKNOWN = 0,
    FREE = 1,
    OBSTACLE = 2,
    WAYPOINT = 3,
    CAR_POSITION = 4
};

// Map cell structure
struct MapCell {
    MapCellType type;
    float confidence;
    uint32_t timestamp;
    bool visited;
};

// Point structure for coordinates
struct Point {
    float x;
    float y;
    float angle;
};

// Waypoint structure
struct Waypoint {
    uint32_t id;
    float x;
    float y;
    String name;
    uint32_t timestamp;
    bool visited;
};

// Map configuration
struct MapConfig {
    float cellSize;        // Size of each cell in meters
    int mapWidth;          // Map width in cells
    int mapHeight;         // Map height in cells
    float originX;         // Origin X coordinate
    float originY;         // Origin Y coordinate
    float maxRange;        // Maximum sensor range in meters
    float minRange;        // Minimum sensor range in meters
};

class SLAMMapper {
private:
    MapConfig config;
    MapCell** map;
    Point carPosition;
    float carAngle;
    std::vector<Waypoint> waypoints;
    bool mapInitialized;
    String mapFileName;
    
    // Mapping parameters
    float occupancyThreshold;
    float freeThreshold;
    int maxIterations;
    
    // Sensor data
    float lastUltrasonicDistance;
    float lastIRLeft;
    float lastIRCenter;
    float lastIRRight;
    
    // Map update functions
    void updateMapCell(int x, int y, MapCellType type, float confidence);
    void updateOccupancyGrid(float distance, float angle);
    void updateFreeSpace(float distance, float angle);
    void updateObstacle(float distance, float angle);
    
    // Coordinate conversion
    Point worldToMap(float worldX, float worldY);
    Point mapToWorld(int mapX, int mapY);
    int getMapIndex(int x, int y);
    
    // Map file operations
    bool saveMapToXML();
    bool loadMapFromXML();
    String generateMapXML();
    String generateWaypointXML();
    
    // Path planning
    std::vector<Point> findPath(Point start, Point goal);
    bool isCellFree(int x, int y);
    float calculateDistance(Point p1, Point p2);
    
public:
    SLAMMapper();
    ~SLAMMapper();
    
    // Initialization
    bool initialize(MapConfig config);
    bool loadMap(String fileName);
    bool saveMap(String fileName);
    
    // Map updates
    void updatePosition(float x, float y, float angle);
    void updateSensors(float ultrasonic, float irLeft, float irCenter, float irRight);
    void processSensorData();
    
    // Waypoint management
    bool addWaypoint(float x, float y, String name = "");
    bool removeWaypoint(uint32_t id);
    bool updateWaypoint(uint32_t id, float x, float y, String name = "");
    std::vector<Waypoint> getWaypoints();
    Waypoint getWaypoint(uint32_t id);
    
    // Map queries
    MapCellType getCellType(int x, int y);
    MapCellType getCellType(float worldX, float worldY);
    float getCellConfidence(int x, int y);
    bool isObstacle(int x, int y);
    bool isFree(int x, int y);
    
    // Path planning
    std::vector<Point> planPath(Point start, Point goal);
    std::vector<Point> planPatrolPath();
    Point getNextWaypoint();
    
    // Map information
    MapConfig getConfig();
    Point getCarPosition();
    float getCarAngle();
    int getMapWidth();
    int getMapHeight();
    float getMapSize();
    
    // Map visualization data
    String getMapDataJSON();
    String getWaypointsJSON();
    String getCarPositionJSON();
    
    // Map operations
    void clearMap();
    void resetMap();
    bool exportMap(String fileName);
    bool importMap(String fileName);
    
    // Statistics
    int getVisitedCells();
    int getObstacleCells();
    int getFreeCells();
    float getMapCoverage();
    
    // Debug functions
    void printMap();
    void printWaypoints();
    void printStatistics();
};

#endif
