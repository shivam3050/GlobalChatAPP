import { UserSection } from "./userSection"


function AllUsers(props) {
  
    return (
        <div>
            <UserSection
                userRef={props.userRef}
                
                setRecentUnreadContactCount={props.setRecentUnreadContactCount}
                socketContainer={props.socketContainer}
                refreshGlobalUsersFlag={props.refreshGlobalUsersFlag}

                CountryMap={props.CountryMap}

            />

        </div>

    )
}

export default AllUsers
