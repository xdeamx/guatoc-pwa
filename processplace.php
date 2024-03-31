<?php
if(isset($_POST['name'])){
   

                        $jsonData = file_get_contents('points.json');

                        // Decode JSON data into PHP associative array
                        $bigArray = json_decode($jsonData, true);
                        $newId = count($bigArray)+1;

                        $data = array(
                            "name" =>  $_POST["name"],
                            "latitude" => $_POST["latitude"],
                            "longitude" => $_POST["longitude"],
                            "date" => date('Y-m-d H:i:s'),
                            "description" => $_POST["description"],
                            "id" => $newId
                        );

                        array_push($bigArray, $data);
                        
                        // Convert PHP array to JSON string
                        $jsonString = json_encode($bigArray);
                        
                        // Specify the file path
                        $filePath = 'points.json';
                        
                        // Write JSON string to file
                        if (file_put_contents($filePath, $jsonString)) {
                            ?>
                                {
                                    "status": "success",
                                    "place" : {
                                        "name": "<?php echo $_POST["name"]; ?>",
                                        "latitude":  "<?php echo $_POST["latitude"]; ?>",
                                        "longitude":  "<?php echo $_POST["longitude"]; ?>",
                                        "description":  "<?php echo $_POST["description"]; ?>",
                                        "id": "<?php echo $newId; ?>"
                                    }
                                }
                             <?php
                            exit();
                        } else {
                            ?>
                            {
                                "status": "fail",
                                "error" : 500,
                                "message" : "Not was persisted"
                            }
                            <?php

                           

                        }
                    } else {
                        ?>
                        {
                            "status": "fail",
                            "error" : 500,
                            "message" : "Not was persisted"
                        }
                        <?php
                    }
                

?>