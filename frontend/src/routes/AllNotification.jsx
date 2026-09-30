import { MyRecentContactSection } from "./myContactSection"



function AllContactsAndNotifications(props) {
    
  
    return (
        <div>
            <MyRecentContactSection

                userRef={props.userRef}
                setRecentUnreadContactCount={props.setRecentUnreadContactCount}
                socketContainer={props.socketContainer}
                refreshUsersFlag={props.refreshUsersFlag}
                CountryMap={props.CountryMap}
                
            />

        </div>

    )
}

export default AllContactsAndNotifications
