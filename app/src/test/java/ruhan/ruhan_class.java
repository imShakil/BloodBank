package ruhan;

public class ruhan_class {
    String name;
    int roll;
    String Id;

    public ruhan_class(String name, int roll, String id) {
        this.name = name;
        this.roll = roll;
        Id = id;
    }

    public String getId() {
        return Id;
    }

    public void setId(String id) {
        Id = id;
    }

    public int getRoll() {
        return roll;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setRoll(int roll) {
        this.roll = roll;
    }
}
