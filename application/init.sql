CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
   id uuid DEFAULT uuid_generate_v4 (),
   username varchar(80),
   salt varchar(80),
   passhash varchar(80),
   PRIMARY KEY (id)
);

CREATE TABLE rooms (
   id uuid DEFAULT uuid_generate_v4 (),
   name varchar(25),
   type varchar(10),
   PRIMARY KEY (id)
);

CREATE TABLE user_rooms (
   id serial primary key,
   user_id uuid NOT NULL,
   room_id uuid NOT NULL,
   CONSTRAINT fk_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
   CONSTRAINT fk_rooms FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE,
   CONSTRAINT unique_user_room UNIQUE (user_id, room_id)
);

CREATE TABLE connected_users (
   id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
   user_id UUID NOT NULL,
   socket_id varchar(60) NOT NULL,
   CONSTRAINT fk_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE messages (
   id uuid DEFAULT uuid_generate_v4 (),
   room_id uuid NOT NULL,
   text varchar(240),
   created_by UUID NOT NULL,
   created_on date,
   CONSTRAINT fk_users FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE,
   CONSTRAINT fk_rooms FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE
);